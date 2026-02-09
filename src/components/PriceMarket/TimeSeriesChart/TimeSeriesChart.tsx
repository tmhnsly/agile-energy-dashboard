'use client';

import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
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
  const dragRef = useRef<DragState | null>(null);
  const rafId = useRef(0);
  const pendingDragRange = useRef<TimeRange | null>(null);
  const dragRangeRef = useRef<TimeRange | null>(null);

  const onRangePreviewRef = useRef(onRangePreview);
  useEffect(() => {
    onRangePreviewRef.current = onRangePreview;
  }, [onRangePreview]);

  const [cursor, setCursor] = useState<string>('crosshair');
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

  const margin = getMargin(width);
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const handleHitWidth = width < 480 ? 24 : 16;

  /* ---- Cleanup RAF on unmount ---- */
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
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
    const prices = points.map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
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

  const activeStats = useMemo(() => {
    const filtered = points.filter(
      (p) => p.ts >= activeRange.fromTs && p.ts <= activeRange.toTs,
    );
    if (filtered.length === 0)
      return { min: null as PricePoint | null, max: null as PricePoint | null };
    let min = filtered[0];
    let max = filtered[0];
    for (const p of filtered) {
      if (p.price < min.price) min = p;
      if (p.price > max.price) max = p;
    }
    return { min, max };
  }, [points, activeRange]);

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

  const isOverFlexBand = useCallback(
    (x: number): boolean => {
      const ts = xScale.invert(x).getTime();
      return visibleFlexEvents.some(
        (ev) => ts >= ev.startTs && ts <= ev.endTs,
      );
    },
    [xScale, visibleFlexEvents],
  );

  const showTooltipForX = useCallback(
    (x: number) => {
      if (points.length === 0) return;
      const ts = xScale.invert(x).getTime();

      let closest = points[0];
      let minDist = Math.abs(points[0].ts - ts);
      for (let i = 1; i < points.length; i++) {
        const dist = Math.abs(points[i].ts - ts);
        if (dist < minDist) {
          minDist = dist;
          closest = points[i];
        }
      }

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

      setCursor(
        type === 'region'
          ? 'grabbing'
          : type === 'new'
            ? 'crosshair'
            : 'ew-resize',
      );
      hideTooltip();
      setHoveredBandId(null);
    },
    [getChartX, getDragType, xScale, activeRange, hideTooltip],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const x = getChartX(e);
      const drag = dragRef.current;

      /* ---- hover (no drag) ---- */
      if (!drag) {
        showTooltipForX(x);
        const hoverType = getDragType(x);
        const overFlex = hoverType === 'new' && isOverFlexBand(x);

        const ts = xScale.invert(x).getTime();
        const band = visibleFlexEvents.find(
          (ev) => ts >= ev.startTs && ts <= ev.endTs,
        );
        setHoveredBandId(band?.id ?? null);

        setCursor(
          hoverType === 'left' || hoverType === 'right'
            ? 'ew-resize'
            : hoverType === 'region'
              ? 'grab'
              : overFlex
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
      isOverFlexBand,
      showTooltipForX,
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
      setCursor('crosshair');

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }

      if (Math.abs(x - drag.originX) < CLICK_THRESHOLD_PX) {
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
          } else {
            // Click on empty area: reset to full range
            onRangeChange({ fromTs: fullRange.fromTs, toTs: fullRange.toTs });
          }
        }
      } else {
        const finalRange = dragRangeRef.current;
        if (finalRange) {
          const snappedFrom = snapToHalfHour(finalRange.fromTs);
          const snappedTo = snapToHalfHour(finalRange.toTs);
          const clampedFrom = clamp(
            snappedFrom,
            fullRange.fromTs,
            fullRange.toTs,
          );
          const clampedTo = clamp(
            snappedTo,
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
    [getChartX, xScale, visibleFlexEvents, onRangeChange, fullRange],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      if (!dragRef.current) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      setCursor('crosshair');
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
      setLocalDragRange(null);
      dragRangeRef.current = null;
      pendingDragRange.current = null;
      onRangePreviewRef.current?.(null);
    },
    [],
  );

  const handlePointerLeave = useCallback(() => {
    if (!dragRef.current) {
      hideTooltip();
      setCursor('crosshair');
      setHoveredBandId(null);
    }
  }, [hideTooltip]);

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

          {/* 5 — Min / Max markers (subtle) */}
          {activeStats.min && (
            <g>
              <circle
                cx={xScale(new Date(activeStats.min.ts))}
                cy={yScale(activeStats.min.price)}
                r={4}
                className={styles.minMarker}
              />
              <text
                x={xScale(new Date(activeStats.min.ts))}
                y={yScale(activeStats.min.price) + 16}
                className={styles.minMaxLabel}
              >
                {formatPricePerKwh(activeStats.min.price)}
              </text>
            </g>
          )}
          {activeStats.max && (
            <g>
              <circle
                cx={xScale(new Date(activeStats.max.ts))}
                cy={yScale(activeStats.max.price)}
                r={4}
                className={styles.maxMarker}
              />
              <text
                x={xScale(new Date(activeStats.max.ts))}
                y={yScale(activeStats.max.price) - 10}
                className={styles.maxMaxLabel}
              >
                {formatPricePerKwh(activeStats.max.price)}
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
            tickLabelProps={{
              fill: 'var(--mono-text-low-contrast)',
              fontSize: 'var(--text-xs)',
              textAnchor: 'middle',
            }}
          />
          <AxisLeft
            scale={yScale}
            numTicks={5}
            tickFormat={(v) => `${Number(v).toFixed(0)}p`}
            stroke="var(--mono-border-subtle)"
            tickStroke="var(--mono-border-subtle)"
            tickLabelProps={{
              fill: 'var(--mono-text-low-contrast)',
              fontSize: 'var(--text-xs)',
              textAnchor: 'end',
              dx: '-0.25em',
              dy: '0.33em',
            }}
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
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            className={styles.interactionOverlay}
            data-cursor={cursor}
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

function SelectionHandle({ x, height }: { x: number; height: number }) {
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
}
