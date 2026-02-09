'use client';

import { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { startOfDay, addDays } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import type { PricePoint, FlexEvent, TimeRange } from '@/types/energy';
import {
  formatTime,
  formatPricePerKwh,
  formatDayShort,
  formatDateTime,
  formatDuration,
} from '@/utils/format';
import { lowerBound, upperBound, bisectNearest } from '@/utils/binarySearch';
import styles from './TimeSeriesChart.module.scss';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MIN_SEL_PX = 10;
const MIN_DOMAIN_MS = 60_000; // 1 min
const CLICK_THRESHOLD_PX = 3;
const HALF_HOUR_MS = 30 * 60 * 1000;

function getMargin(width: number) {
  const left = width < 480 ? 40 : 56;
  return { top: 20, right: 12, bottom: 40, left };
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function snapToHalfHour(ts: number): number {
  return Math.round(ts / HALF_HOUR_MS) * HALF_HOUR_MS;
}

const AXIS_BOTTOM_TICK_LABEL_PROPS = {
  fill: 'var(--mono-text-low-contrast)',
  fontSize: 'var(--text-sm)',
  textAnchor: 'middle' as const,
};

const AXIS_LEFT_TICK_LABEL_PROPS = {
  fill: 'var(--mono-text-low-contrast)',
  fontSize: 'var(--text-sm)',
  textAnchor: 'end' as const,
  dx: '-0.25em',
  dy: '0.33em',
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface TimeSeriesChartProps {
  points: PricePoint[];
  flexEvents: FlexEvent[];
  fullRange: TimeRange;
  activeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  /** Fires on every frame during drag so the parent can show live stats. */
  onRangePreview?: (range: TimeRange | null) => void;
  width: number;
  height: number;
}

interface TooltipData {
  point: PricePoint;
  inFlexEvent: FlexEvent | null;
}

interface DragState {
  type: 'left' | 'right' | 'region' | 'new';
  originX: number;
  originTs: number;
  startFromTs: number;
  startToTs: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const TimeSeriesChart = ({
  points,
  flexEvents,
  fullRange,
  activeRange,
  onRangeChange,
  onRangePreview,
  width,
  height,
}: TimeSeriesChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const overlayRef = useRef<SVGRectElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const rafId = useRef(0);
  const pendingDragRange = useRef<TimeRange | null>(null);
  const dragRangeRef = useRef<TimeRange | null>(null);
  const hoverRafId = useRef(0);
  const pendingHoverX = useRef<number | null>(null);

  const onRangePreviewRef = useRef(onRangePreview);
  useEffect(() => {
    onRangePreviewRef.current = onRangePreview;
  }, [onRangePreview]);

  /* Cursor lives in a ref — updated via DOM to skip per-move rerenders. */
  const cursorRef = useRef('crosshair');
  const updateCursor = useCallback((value: string) => {
    if (cursorRef.current !== value) {
      cursorRef.current = value;
      overlayRef.current?.setAttribute('data-cursor', value);
    }
  }, []);

  const [localDragRange, setLocalDragRange] = useState<TimeRange | null>(null);
  const [hoveredBandId, setHoveredBandId] = useState<string | null>(null);

  const {
    showTooltip,
    hideTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft,
    tooltipTop,
  } = useTooltip<TooltipData>();

  const margin = useMemo(() => getMargin(width), [width]);
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const handleHitWidth = width < 480 ? 24 : 16;

  /* ---- Cleanup RAF on unmount ---- */
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (hoverRafId.current) cancelAnimationFrame(hoverRafId.current);
    };
  }, []);

  /* ---- scales ---- */

  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [new Date(fullRange.fromTs), new Date(fullRange.toTs)],
        range: [0, innerWidth],
      }),
    [fullRange, innerWidth],
  );

  const yScale = useMemo(() => {
    if (points.length === 0)
      return scaleLinear({ domain: [0, 100], range: [innerHeight, 0] });
    let minP = points[0].price;
    let maxP = points[0].price;
    for (let i = 1; i < points.length; i++) {
      const p = points[i].price;
      if (p < minP) minP = p;
      if (p > maxP) maxP = p;
    }
    const pad = (maxP - minP) * 0.1 || 5;
    return scaleLinear({
      domain: [minP - pad, maxP + pad],
      range: [innerHeight, 0],
      nice: true,
    });
  }, [points, innerHeight]);

  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);

  /* ---- derived data ---- */

  const visibleFlexEvents = useMemo(
    () =>
      flexEvents.filter(
        (e) => e.endTs >= fullRange.fromTs && e.startTs <= fullRange.toTs,
      ),
    [flexEvents, fullRange],
  );

  const selectedEventId = useMemo(() => {
    const m = visibleFlexEvents.find(
      (e) => e.startTs === activeRange.fromTs && e.endTs === activeRange.toTs,
    );
    return m?.id ?? null;
  }, [visibleFlexEvents, activeRange]);

  const dayBoundaries = useMemo(() => {
    const boundaries: number[] = [];
    let day = addDays(startOfDay(new UTCDate(fullRange.fromTs)), 1);
    while (day.getTime() < fullRange.toTs) {
      if (day.getTime() > fullRange.fromTs) boundaries.push(day.getTime());
      day = addDays(day, 1);
    }
    return boundaries;
  }, [fullRange]);

  /* ---- display range (live drag or committed) ---- */

  const displayRange = localDragRange ?? activeRange;
  const displaySelLeftX = xScale(new Date(displayRange.fromTs));
  const displaySelRightX = xScale(new Date(displayRange.toTs));
  const isFullSelection =
    displayRange.fromTs <= fullRange.fromTs &&
    displayRange.toTs >= fullRange.toTs;
  const isDragging = localDragRange !== null;

  const displayStats = useMemo(() => {
    const start = lowerBound(points, displayRange.fromTs);
    const end = upperBound(points, displayRange.toTs);
    if (start >= end)
      return { min: null as PricePoint | null, max: null as PricePoint | null };
    let min = points[start];
    let max = points[start];
    for (let i = start + 1; i < end; i++) {
      const p = points[i];
      if (p.price < min.price) min = p;
      if (p.price > max.price) max = p;
    }
    return { min, max };
  }, [points, displayRange]);

  /* ---- pointer helpers ---- */

  const getChartX = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      const pt = localPoint(svgRef.current!, e);
      if (!pt) return 0;
      return pt.x - margin.left;
    },
    [margin.left],
  );

  const getDragType = useCallback(
    (x: number): DragState['type'] => {
      if (!isFullSelection) {
        if (Math.abs(x - displaySelLeftX) <= handleHitWidth) return 'left';
        if (Math.abs(x - displaySelRightX) <= handleHitWidth) return 'right';
        if (
          x > displaySelLeftX + handleHitWidth &&
          x < displaySelRightX - handleHitWidth
        )
          return 'region';
      }
      return 'new';
    },
    [displaySelLeftX, displaySelRightX, isFullSelection, handleHitWidth],
  );

  const showTooltipForX = useCallback(
    (x: number) => {
      if (points.length === 0) return;
      const ts = xScale.invert(x).getTime();
      const idx = bisectNearest(points, ts);
      if (idx < 0) return;
      const closest = points[idx];

      const inFlexEvent =
        visibleFlexEvents.find(
          (e) => closest.ts >= e.startTs && closest.ts <= e.endTs,
        ) ?? null;

      showTooltip({
        tooltipData: { point: closest, inFlexEvent },
        tooltipLeft: xScale(new Date(closest.ts)) + margin.left,
        tooltipTop: yScale(closest.price) + margin.top,
      });
    },
    [points, xScale, yScale, visibleFlexEvents, showTooltip, margin],
  );

  const showTooltipForXRef = useRef(showTooltipForX);
  showTooltipForXRef.current = showTooltipForX;

  /* ---- pointer event handlers ---- */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const x = getChartX(e);
      const type = getDragType(x);
      const ts = xScale.invert(x).getTime();

      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();

      dragRef.current = {
        type,
        originX: x,
        originTs: ts,
        startFromTs: activeRange.fromTs,
        startToTs: activeRange.toTs,
      };

      if (type !== 'new') {
        dragRangeRef.current = {
          fromTs: activeRange.fromTs,
          toTs: activeRange.toTs,
        };
        setLocalDragRange({
          fromTs: activeRange.fromTs,
          toTs: activeRange.toTs,
        });
      }

      updateCursor(
        type === 'region'
          ? 'grabbing'
          : type === 'new'
            ? 'crosshair'
            : 'ew-resize',
      );
      hideTooltip();
      setHoveredBandId(null);
    },
    [getChartX, getDragType, xScale, activeRange, hideTooltip, updateCursor],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const x = getChartX(e);
      const drag = dragRef.current;

      /* ---- hover (no drag) ---- */
      if (!drag) {
        /* Throttle tooltip updates to once per animation frame. */
        pendingHoverX.current = x;
        if (!hoverRafId.current) {
          hoverRafId.current = requestAnimationFrame(() => {
            hoverRafId.current = 0;
            if (pendingHoverX.current !== null) {
              showTooltipForXRef.current(pendingHoverX.current);
              pendingHoverX.current = null;
            }
          });
        }

        const hoverType = getDragType(x);

        // Only detect flex-band hover when NOT over selection handles / region
        let bandId: string | null = null;
        if (hoverType === 'new') {
          const ts = xScale.invert(x).getTime();
          const band = visibleFlexEvents.find(
            (ev) => ts >= ev.startTs && ts <= ev.endTs,
          );
          bandId = band?.id ?? null;
        }
        setHoveredBandId(bandId);

        updateCursor(
          hoverType === 'left' || hoverType === 'right'
            ? 'ew-resize'
            : hoverType === 'region'
              ? 'grab'
              : bandId !== null
                ? 'pointer'
                : 'crosshair',
        );
        return;
      }

      /* ---- drag in domain space ---- */
      const currentTs = xScale.invert(x).getTime();
      const dTs = currentTs - drag.originTs;

      let fromTs = drag.startFromTs;
      let toTs = drag.startToTs;

      switch (drag.type) {
        case 'left':
          fromTs = clamp(
            drag.startFromTs + dTs,
            fullRange.fromTs,
            drag.startToTs - MIN_DOMAIN_MS,
          );
          break;
        case 'right':
          toTs = clamp(
            drag.startToTs + dTs,
            drag.startFromTs + MIN_DOMAIN_MS,
            fullRange.toTs,
          );
          break;
        case 'region': {
          const dur = drag.startToTs - drag.startFromTs;
          fromTs = drag.startFromTs + dTs;
          toTs = drag.startToTs + dTs;
          if (fromTs < fullRange.fromTs) {
            fromTs = fullRange.fromTs;
            toTs = fullRange.fromTs + dur;
          }
          if (toTs > fullRange.toTs) {
            toTs = fullRange.toTs;
            fromTs = fullRange.toTs - dur;
          }
          break;
        }
        case 'new': {
          fromTs = clamp(
            Math.min(currentTs, drag.originTs),
            fullRange.fromTs,
            fullRange.toTs,
          );
          toTs = clamp(
            Math.max(currentTs, drag.originTs),
            fullRange.fromTs,
            fullRange.toTs,
          );
          break;
        }
      }

      const leftPx = xScale(new Date(fromTs));
      const rightPx = xScale(new Date(toTs));
      if (rightPx - leftPx >= MIN_SEL_PX) {
        const newRange = { fromTs, toTs };
        dragRangeRef.current = newRange;
        pendingDragRange.current = newRange;
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            if (pendingDragRange.current) {
              setLocalDragRange(pendingDragRange.current);
              onRangePreviewRef.current?.(pendingDragRange.current);
            }
            rafId.current = 0;
          });
        }
      }
    },
    [
      getChartX,
      getDragType,
      updateCursor,
      xScale,
      visibleFlexEvents,
      fullRange,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const drag = dragRef.current;
      if (!drag) return;

      const x = getChartX(e);
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      updateCursor('crosshair');

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }

      if (Math.abs(x - drag.originX) < CLICK_THRESHOLD_PX) {
        // Click (not drag) — only select a flex event if one was hit
        if (drag.type === 'new') {
          const clickTs = xScale.invert(x).getTime();
          const hitEvents = visibleFlexEvents.filter(
            (ev) => clickTs >= ev.startTs && clickTs <= ev.endTs,
          );
          if (hitEvents.length > 0) {
            const event = hitEvents.reduce((a, b) =>
              a.endTs - a.startTs < b.endTs - b.startTs ? a : b,
            );
            onRangeChange({ fromTs: event.startTs, toTs: event.endTs });
          }
          // Otherwise do nothing — use the Reset button for full-range reset
        }
      } else {
        // Commit the exact drag range (no snapping to avoid visual jump)
        const finalRange = dragRangeRef.current;
        if (finalRange) {
          const clampedFrom = clamp(
            finalRange.fromTs,
            fullRange.fromTs,
            fullRange.toTs,
          );
          const clampedTo = clamp(
            finalRange.toTs,
            fullRange.fromTs,
            fullRange.toTs,
          );
          if (clampedTo > clampedFrom) {
            onRangeChange({ fromTs: clampedFrom, toTs: clampedTo });
          }
        }
      }

      setLocalDragRange(null);
      dragRangeRef.current = null;
      pendingDragRange.current = null;
      onRangePreviewRef.current?.(null);
    },
    [getChartX, xScale, visibleFlexEvents, onRangeChange, fullRange, updateCursor],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      if (!dragRef.current) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      updateCursor('crosshair');
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
      setLocalDragRange(null);
      dragRangeRef.current = null;
      pendingDragRange.current = null;
      onRangePreviewRef.current?.(null);
    },
    [updateCursor],
  );

  const handlePointerLeave = useCallback(() => {
    if (!dragRef.current) {
      if (hoverRafId.current) {
        cancelAnimationFrame(hoverRafId.current);
        hoverRafId.current = 0;
      }
      pendingHoverX.current = null;
      hideTooltip();
      updateCursor('crosshair');
      setHoveredBandId(null);
    }
  }, [hideTooltip, updateCursor]);

  /* ---- pill position ---- */

  const pillLeft = margin.left + (displaySelLeftX + displaySelRightX) / 2;
  const pillLeftClamped = clamp(pillLeft, 80, width - 80);
  const pillTop = margin.top + 8;
  const pillFromTs = isDragging
    ? snapToHalfHour(displayRange.fromTs)
    : displayRange.fromTs;
  const pillToTs = isDragging
    ? snapToHalfHour(displayRange.toTs)
    : displayRange.toTs;

  /* ---- early exit ---- */

  if (width < 10 || height < 10) return null;

  /* ---- render ---- */

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label="Energy price time series chart"
        style={{ touchAction: 'none' }}
      >
        <Group left={margin.left} top={margin.top}>
          {/* 1 — Alternating horizontal stripes */}
          {yTicks.slice(0, -1).map((tick, i) => {
            if (i % 2 !== 0) return null;
            const nextTick = yTicks[i + 1];
            const y0 = yScale(nextTick);
            const y1 = yScale(tick);
            return (
              <rect
                key={`stripe-${i}`}
                x={0}
                y={y0}
                width={innerWidth}
                height={y1 - y0}
                className={styles.stripe}
              />
            );
          })}

          {/* 1b — Horizontal gridlines */}
          {yTicks.map((tick, i) => (
            <line
              key={`grid-${i}`}
              x1={0}
              y1={yScale(tick)}
              x2={innerWidth}
              y2={yScale(tick)}
              className={styles.gridLine}
            />
          ))}

          {/* 2 — Day boundaries */}
          {dayBoundaries.map((ts) => {
            const bx = xScale(new Date(ts));
            return (
              <g key={`day-${ts}`}>
                <line
                  x1={bx}
                  y1={0}
                  x2={bx}
                  y2={innerHeight}
                  className={styles.dayBoundary}
                />
                <text x={bx + 4} y={12} className={styles.dayLabel}>
                  {formatDayShort(ts)}
                </text>
              </g>
            );
          })}

          {/* 3 — Flex event bands (soft fill + thin left edge) */}
          {visibleFlexEvents.map((e) => {
            const x0 = Math.max(0, xScale(new Date(e.startTs)));
            const x1 = Math.min(innerWidth, xScale(new Date(e.endTs)));
            const isSelected = e.id === selectedEventId;
            const isHovered = e.id === hoveredBandId;
            const bandClass = isSelected
              ? styles.eventBandSelected
              : isHovered
                ? styles.eventBandHover
                : styles.eventBand;
            const edgeClass = isSelected
              ? styles.eventBandEdgeSelected
              : isHovered
                ? styles.eventBandEdgeHover
                : styles.eventBandEdge;
            return (
              <g key={e.id}>
                <rect
                  x={x0}
                  y={0}
                  width={Math.max(0, x1 - x0)}
                  height={innerHeight}
                  className={bandClass}
                />
                <line
                  x1={x0}
                  y1={0}
                  x2={x0}
                  y2={innerHeight}
                  className={edgeClass}
                />
                <line
                  x1={x1}
                  y1={0}
                  x2={x1}
                  y2={innerHeight}
                  className={edgeClass}
                />
              </g>
            );
          })}

          {/* 4 — Price line */}
          <LinePath
            data={points}
            x={(d) => xScale(new Date(d.ts))}
            y={(d) => yScale(d.price)}
            curve={curveMonotoneX}
            className={styles.priceLine}
          />

          {/* 5 — Min / Max markers (live during drag) */}
          {displayStats.min && (
            <g>
              <circle
                cx={xScale(new Date(displayStats.min.ts))}
                cy={yScale(displayStats.min.price)}
                r={4}
                className={styles.minMarker}
              />
              <text
                x={xScale(new Date(displayStats.min.ts))}
                y={yScale(displayStats.min.price) + 16}
                className={styles.minMaxLabel}
              >
                {formatPricePerKwh(displayStats.min.price)}
              </text>
            </g>
          )}
          {displayStats.max && (
            <g>
              <circle
                cx={xScale(new Date(displayStats.max.ts))}
                cy={yScale(displayStats.max.price)}
                r={4}
                className={styles.maxMarker}
              />
              <text
                x={xScale(new Date(displayStats.max.ts))}
                y={yScale(displayStats.max.price) - 10}
                className={styles.maxMaxLabel}
              >
                {formatPricePerKwh(displayStats.max.price)}
              </text>
            </g>
          )}

          {/* 6 — Selection overlay */}
          {!isFullSelection && (
            <>
              {/* Dim regions */}
              <rect
                x={0}
                y={0}
                width={Math.max(0, displaySelLeftX)}
                height={innerHeight}
                className={styles.dimOverlay}
              />
              <rect
                x={displaySelRightX}
                y={0}
                width={Math.max(0, innerWidth - displaySelRightX)}
                height={innerHeight}
                className={styles.dimOverlay}
              />
              {/* Selection fill */}
              <rect
                x={displaySelLeftX}
                y={0}
                width={Math.max(0, displaySelRightX - displaySelLeftX)}
                height={innerHeight}
                className={styles.selectionFill}
              />
              {/* Boundary lines */}
              <line
                x1={displaySelLeftX}
                y1={0}
                x2={displaySelLeftX}
                y2={innerHeight}
                className={styles.selectionBoundary}
              />
              <line
                x1={displaySelRightX}
                y1={0}
                x2={displaySelRightX}
                y2={innerHeight}
                className={styles.selectionBoundary}
              />
              {/* Handles */}
              <SelectionHandle x={displaySelLeftX} height={innerHeight} />
              <SelectionHandle x={displaySelRightX} height={innerHeight} />
            </>
          )}

          {/* 7 — Axes */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={Math.min(8, Math.floor(innerWidth / 80))}
            tickFormat={(d) => formatTime((d as Date).getTime())}
            stroke="var(--mono-border-subtle)"
            tickStroke="var(--mono-border-subtle)"
            tickLabelProps={AXIS_BOTTOM_TICK_LABEL_PROPS}
          />
          <AxisLeft
            scale={yScale}
            numTicks={5}
            tickFormat={(v) => `${Number(v).toFixed(0)}p`}
            stroke="var(--mono-border-subtle)"
            tickStroke="var(--mono-border-subtle)"
            tickLabelProps={AXIS_LEFT_TICK_LABEL_PROPS}
          />

          {/* 8 — Tooltip crosshair (hidden during drag) */}
          {tooltipOpen && tooltipData && !isDragging && (
            <>
              <line
                x1={xScale(new Date(tooltipData.point.ts))}
                y1={0}
                x2={xScale(new Date(tooltipData.point.ts))}
                y2={innerHeight}
                className={styles.crosshair}
              />
              <circle
                cx={xScale(new Date(tooltipData.point.ts))}
                cy={yScale(tooltipData.point.price)}
                r={4}
                className={styles.tooltipDot}
              />
            </>
          )}

          {/* 9 — Interaction overlay (must be last) */}
          <rect
            ref={overlayRef}
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            className={styles.interactionOverlay}
            data-cursor="crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerLeave}
          />
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && !isDragging && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          className={styles.tooltip}
        >
          <div className={styles.tooltipTime}>
            {formatDateTime(tooltipData.point.ts)}
          </div>
          <div className={styles.tooltipPrice}>
            {formatPricePerKwh(tooltipData.point.price)}
          </div>
          {tooltipData.inFlexEvent && (
            <div className={styles.tooltipFlex}>
              <span className={styles.tooltipFlexBadge}>Flex</span>
              {tooltipData.inFlexEvent.label}
            </div>
          )}
        </TooltipWithBounds>
      )}

      {/* Drag range pill */}
      {isDragging && (
        <div
          className={styles.dragPill}
          style={{ left: pillLeftClamped, top: pillTop }}
        >
          <span>{formatTime(pillFromTs)}</span>
          <span className={styles.dragPillSep}>&ndash;</span>
          <span>{formatTime(pillToTs)}</span>
          <span className={styles.dragPillDuration}>
            ({formatDuration(pillFromTs, pillToTs)})
          </span>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Selection handle                                                    */
/* ------------------------------------------------------------------ */

const SelectionHandle = memo(function SelectionHandle({ x, height }: { x: number; height: number }) {
  const capH = Math.min(36, height * 0.3);
  const capY = (height - capH) / 2;
  const capW = 6;
  const gripGap = 5;
  const gripMid = capY + capH / 2;

  return (
    <g>
      {/* Invisible hit area */}
      <rect x={x - 16} y={0} width={32} height={height} fill="transparent" />
      {/* End cap */}
      <rect
        x={x - capW / 2}
        y={capY}
        width={capW}
        height={capH}
        rx={3}
        className={styles.selectionCap}
      />
      {/* Grip nubs (dots) */}
      <circle
        cx={x}
        cy={gripMid - gripGap}
        r={1.2}
        className={styles.gripNub}
      />
      <circle cx={x} cy={gripMid} r={1.2} className={styles.gripNub} />
      <circle
        cx={x}
        cy={gripMid + gripGap}
        r={1.2}
        className={styles.gripNub}
      />
    </g>
  );
});
