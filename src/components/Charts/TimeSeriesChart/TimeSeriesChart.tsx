'use client';

import { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { startOfDay, addDays } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import type { TimeRange } from '@/types/energy';
import type { ChartSeries, ChartBand, ChartDataPoint } from '@/types/chart';
import {
  formatTime,
  formatDayShort,
  formatDateTime,
  formatDuration,
} from '@/utils/format';
import { lowerBound, upperBound, bisectNearest } from '@/utils/binarySearch';
import styles from './TimeSeriesChart.module.scss';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

// Interaction thresholds
const MIN_SEL_PX = 10;
const CLICK_THRESHOLD_PX = 3;

// Time constants
const MIN_DOMAIN_MS = 60_000;
const HALF_HOUR_MS = 30 * 60_000;

// Axis layout
const CHAR_WIDTH_PX = 7.5;
const AXIS_LABEL_PAD = 12;
const Y_TICK_COUNT = 5;
const MAX_X_TICKS = 8;
const X_TICK_MIN_SPACING_PX = 80;
const TEMP_SCALE_RANGE: [number, number] = [100, 0];

// Chart margins (defaults when not overridden)
const DEFAULT_MARGIN_TOP = 12;
const DEFAULT_MARGIN_RIGHT = 4;
const DEFAULT_MARGIN_BOTTOM = 28;

// Responsive handle sizing
const MOBILE_WIDTH_THRESHOLD = 480;
const HANDLE_HIT_WIDTH_MOBILE = 24;
const HANDLE_HIT_WIDTH_DESKTOP = 16;

// Drag pill positioning
const PILL_EDGE_PAD = 80;
const PILL_TOP_OFFSET = 8;

// Selection handle geometry
const HANDLE_CAP_MAX_HEIGHT = 36;
const HANDLE_CAP_HEIGHT_RATIO = 0.3;
const HANDLE_CAP_WIDTH = 6;
const GRIP_NUB_GAP = 5;
const GRIP_NUB_RADIUS = 1.2;
const HANDLE_CAP_RADIUS = 3;
const HANDLE_HIT_RECT_HALF = 16;

// Marker geometry
const MARKER_RADIUS = 4;
const MIN_LABEL_OFFSET_Y = 16;
const MAX_LABEL_OFFSET_Y = 10;

export type ChartMargin = { top: number; right: number; bottom: number; left: number };

/**
 * Estimate the pixel width of a string at the chart's label font size.
 * Used to auto-compute the left margin from the widest y-axis tick label.
 */
function estimateTextWidth(text: string): number {
  return text.length * CHAR_WIDTH_PX;
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

function defaultFormatYTick(v: number): string {
  return String(v);
}

const TONE_STROKE: Record<string, string> = {
  accent: 'var(--accent-solid)',
  positive: 'var(--success-solid)',
  negative: 'var(--error-solid)',
  warning: 'var(--warning-solid)',
};

const BAND_TONE_FILL: Record<string, { bg: string; border: string; bgHover: string; borderHover: string }> = {
  warning: {
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    bgHover: 'var(--warning-bg-hover)',
    borderHover: 'var(--warning-border-hover)',
  },
  accent: {
    bg: 'var(--accent-bg)',
    border: 'var(--accent-border)',
    bgHover: 'var(--accent-bg-hover)',
    borderHover: 'var(--accent-border-hover)',
  },
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface TimeSeriesChartProps {
  series: ChartSeries[];
  bands?: ChartBand[];
  fullRange: TimeRange;
  activeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  /** Fires on every frame during drag so the parent can show live stats. */
  onRangePreview?: (range: TimeRange | null) => void;
  width: number;
  height: number;
  /** Override chart margins. Left margin auto-sizes from y-axis labels if omitted. */
  margin?: Partial<ChartMargin>;
  /** Format y-axis tick labels. Default: `String(v)` */
  formatYTick?: (value: number) => string;
  /** Format x-axis tick labels. Default: HH:mm */
  formatXTick?: (ts: number) => string;
  /** Format value for tooltip display. Default: `v => v.toFixed(1)` */
  formatTooltipValue?: (value: number) => string;
  /** Accessible label for the chart SVG. */
  ariaLabel?: string;
  /** Show min/max markers on the primary series. Default: true */
  showMinMaxMarkers?: boolean;
}

interface TooltipData {
  ts: number;
  values: Array<{ seriesId: string; label: string; value: number; tone?: string }>;
  inBand: ChartBand | null;
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
  series,
  bands = [],
  fullRange,
  activeRange,
  onRangeChange,
  onRangePreview,
  width,
  height,
  margin: marginProp,
  formatYTick: formatYTickProp,
  formatXTick: formatXTickProp,
  formatTooltipValue: formatTooltipValueProp,
  ariaLabel = 'Time series chart',
  showMinMaxMarkers = true,
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

  /* ---- formatters (stable refs to avoid re-render cascades) ---- */
  const fmtYTickRef = useRef(formatYTickProp);
  useEffect(() => { fmtYTickRef.current = formatYTickProp; }, [formatYTickProp]);
  const fmtYTick = useCallback(
    (v: number) => (fmtYTickRef.current ?? defaultFormatYTick)(v),
    [],
  );
  const fmtXTick = formatXTickProp ?? formatTime;
  const fmtTooltipValue = formatTooltipValueProp ?? ((v: number) => v.toFixed(1));

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

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  /* ---- primary data (first series) ---- */
  const primaryData = useMemo(() => series[0]?.data ?? [], [series]);

  /* ---- auto-sized margins ---- */

  // Compute y-axis domain across ALL series
  const yDomain: [number, number] = useMemo(() => {
    let hasData = false;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const s of series) {
      for (const d of s.data) {
        hasData = true;
        if (d.value < minV) minV = d.value;
        if (d.value > maxV) maxV = d.value;
      }
    }
    if (!hasData) return [0, 100];
    const pad = (maxV - minV) * 0.1 || 5;
    return [minV - pad, maxV + pad];
  }, [series]);

  // Auto-compute left margin from the widest y-axis label
  const autoLeftMargin = useMemo(() => {
    const fmt = formatYTickProp ?? defaultFormatYTick;
    const tempScale = scaleLinear({ domain: yDomain, range: TEMP_SCALE_RANGE, nice: true });
    const ticks = tempScale.ticks(Y_TICK_COUNT);
    const maxWidth = Math.max(...ticks.map((t) => estimateTextWidth(fmt(t))));
    return Math.ceil(maxWidth + AXIS_LABEL_PAD);
  }, [yDomain, formatYTickProp]);

  const margin: ChartMargin = useMemo(() => ({
    top: marginProp?.top ?? DEFAULT_MARGIN_TOP,
    right: marginProp?.right ?? DEFAULT_MARGIN_RIGHT,
    bottom: marginProp?.bottom ?? DEFAULT_MARGIN_BOTTOM,
    left: marginProp?.left ?? autoLeftMargin,
  }), [marginProp, autoLeftMargin]);

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const handleHitWidth = width < MOBILE_WIDTH_THRESHOLD ? HANDLE_HIT_WIDTH_MOBILE : HANDLE_HIT_WIDTH_DESKTOP;

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

  const yScale = useMemo(
    () => scaleLinear({ domain: yDomain, range: [innerHeight, 0], nice: true }),
    [yDomain, innerHeight],
  );

  const yTicks = useMemo(() => yScale.ticks(Y_TICK_COUNT), [yScale]);

  /* ---- derived data ---- */

  const visibleBands = useMemo(
    () =>
      bands.filter(
        (b) => b.endTs >= fullRange.fromTs && b.startTs <= fullRange.toTs,
      ),
    [bands, fullRange],
  );

  const selectedBandId = useMemo(() => {
    const m = visibleBands.find(
      (b) => b.startTs === activeRange.fromTs && b.endTs === activeRange.toTs,
    );
    return m?.id ?? null;
  }, [visibleBands, activeRange]);

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
    if (!showMinMaxMarkers) return { min: null as ChartDataPoint | null, max: null as ChartDataPoint | null };
    const start = lowerBound(primaryData, displayRange.fromTs);
    const end = upperBound(primaryData, displayRange.toTs);
    if (start >= end)
      return { min: null as ChartDataPoint | null, max: null as ChartDataPoint | null };
    let min = primaryData[start];
    let max = primaryData[start];
    for (let i = start + 1; i < end; i++) {
      const p = primaryData[i];
      if (p.value < min.value) min = p;
      if (p.value > max.value) max = p;
    }
    return { min, max };
  }, [primaryData, displayRange, showMinMaxMarkers]);

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
      if (primaryData.length === 0) return;
      const ts = xScale.invert(x).getTime();
      const idx = bisectNearest(primaryData, ts);
      if (idx < 0) return;
      const closest = primaryData[idx];

      // Build values from all series
      const values = series.map((s) => {
        const sIdx = bisectNearest(s.data, closest.ts);
        const point = sIdx >= 0 ? s.data[sIdx] : null;
        return {
          seriesId: s.id,
          label: s.label,
          value: point?.value ?? 0,
          tone: s.tone,
        };
      });

      const inBand =
        visibleBands.find(
          (b) => closest.ts >= b.startTs && closest.ts <= b.endTs,
        ) ?? null;

      showTooltip({
        tooltipData: { ts: closest.ts, values, inBand },
        tooltipLeft: xScale(new Date(closest.ts)) + margin.left,
        tooltipTop: yScale(closest.value) + margin.top,
      });
    },
    [primaryData, series, xScale, yScale, visibleBands, showTooltip, margin],
  );

  const showTooltipForXRef = useRef(showTooltipForX);
  useEffect(() => { showTooltipForXRef.current = showTooltipForX; }, [showTooltipForX]);

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

        // Only detect band hover when NOT over selection handles / region
        let bandId: string | null = null;
        if (hoverType === 'new') {
          const ts = xScale.invert(x).getTime();
          const band = visibleBands.find(
            (b) => ts >= b.startTs && ts <= b.endTs,
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
      visibleBands,
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
        // Click (not drag) — only select a band if one was hit
        if (drag.type === 'new') {
          const clickTs = xScale.invert(x).getTime();
          const hitBands = visibleBands.filter(
            (b) => clickTs >= b.startTs && clickTs <= b.endTs,
          );
          if (hitBands.length > 0) {
            const band = hitBands.reduce((a, b) =>
              a.endTs - a.startTs < b.endTs - b.startTs ? a : b,
            );
            onRangeChange({ fromTs: band.startTs, toTs: band.endTs });
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
    [getChartX, xScale, visibleBands, onRangeChange, fullRange, updateCursor],
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
  const pillLeftClamped = clamp(pillLeft, PILL_EDGE_PAD, width - PILL_EDGE_PAD);
  const pillTop = margin.top + PILL_TOP_OFFSET;
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
    <div ref={containerRef} className={styles.container}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
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

          {/* 3 — Bands */}
          {visibleBands.map((b) => {
            const x0 = Math.max(0, xScale(new Date(b.startTs)));
            const x1 = Math.min(innerWidth, xScale(new Date(b.endTs)));
            const isSelected = b.id === selectedBandId;
            const isHovered = b.id === hoveredBandId;
            const tone = BAND_TONE_FILL[b.tone ?? 'warning'] ?? BAND_TONE_FILL.warning;
            const bandClass = isSelected
              ? styles.bandSelected
              : isHovered
                ? styles.bandHover
                : styles.band;
            const edgeClass = isSelected
              ? styles.bandEdgeSelected
              : isHovered
                ? styles.bandEdgeHover
                : styles.bandEdge;
            return (
              <g key={b.id}>
                <rect
                  x={x0}
                  y={0}
                  width={Math.max(0, x1 - x0)}
                  height={innerHeight}
                  className={bandClass}
                  style={{ fill: isSelected ? tone.bgHover : tone.bg }}
                />
                <line
                  x1={x0}
                  y1={0}
                  x2={x0}
                  y2={innerHeight}
                  className={edgeClass}
                  style={{ stroke: isSelected ? tone.borderHover : tone.border }}
                />
                <line
                  x1={x1}
                  y1={0}
                  x2={x1}
                  y2={innerHeight}
                  className={edgeClass}
                  style={{ stroke: isSelected ? tone.borderHover : tone.border }}
                />
              </g>
            );
          })}

          {/* 4 — Series lines */}
          {series.map((s) => {
            const stroke = TONE_STROKE[s.tone ?? 'accent'] ?? TONE_STROKE.accent;
            return (
              <LinePath
                key={s.id}
                data={s.data}
                x={(d) => xScale(new Date(d.ts))}
                y={(d) => yScale(d.value)}
                curve={curveMonotoneX}
                className={styles.seriesLine}
                style={{ stroke }}
              />
            );
          })}

          {/* 5 — Min / Max markers (live during drag) */}
          {showMinMaxMarkers && displayStats.min && (
            <g>
              <circle
                cx={xScale(new Date(displayStats.min.ts))}
                cy={yScale(displayStats.min.value)}
                r={MARKER_RADIUS}
                className={styles.minMarker}
              />
              <text
                x={xScale(new Date(displayStats.min.ts))}
                y={yScale(displayStats.min.value) + MIN_LABEL_OFFSET_Y}
                className={styles.minMaxLabel}
              >
                {fmtTooltipValue(displayStats.min.value)}
              </text>
            </g>
          )}
          {showMinMaxMarkers && displayStats.max && (
            <g>
              <circle
                cx={xScale(new Date(displayStats.max.ts))}
                cy={yScale(displayStats.max.value)}
                r={MARKER_RADIUS}
                className={styles.maxMarker}
              />
              <text
                x={xScale(new Date(displayStats.max.ts))}
                y={yScale(displayStats.max.value) - MAX_LABEL_OFFSET_Y}
                className={styles.maxMaxLabel}
              >
                {fmtTooltipValue(displayStats.max.value)}
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
            numTicks={Math.min(MAX_X_TICKS, Math.floor(innerWidth / X_TICK_MIN_SPACING_PX))}
            tickFormat={(d) => fmtXTick((d as Date).getTime())}
            stroke="var(--mono-border-subtle)"
            tickStroke="var(--mono-border-subtle)"
            tickLabelProps={AXIS_BOTTOM_TICK_LABEL_PROPS}
          />
          <AxisLeft
            scale={yScale}
            numTicks={Y_TICK_COUNT}
            tickFormat={(v) => fmtYTick(Number(v))}
            stroke="var(--mono-border-subtle)"
            tickStroke="var(--mono-border-subtle)"
            tickLabelProps={AXIS_LEFT_TICK_LABEL_PROPS}
          />

          {/* 8 — Tooltip crosshair (hidden during drag) */}
          {tooltipOpen && tooltipData && !isDragging && (
            <>
              <line
                x1={xScale(new Date(tooltipData.ts))}
                y1={0}
                x2={xScale(new Date(tooltipData.ts))}
                y2={innerHeight}
                className={styles.crosshair}
              />
              <circle
                cx={xScale(new Date(tooltipData.ts))}
                cy={yScale(tooltipData.values[0]?.value ?? 0)}
                r={MARKER_RADIUS}
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
        <TooltipInPortal
          left={tooltipLeft}
          top={tooltipTop}
          className={styles.tooltip}
        >
          <div className={styles.tooltipTime}>
            {formatDateTime(tooltipData.ts)}
          </div>
          {tooltipData.values.map((v) => (
            <div key={v.seriesId} className={styles.tooltipValue}>
              {fmtTooltipValue(v.value)}
            </div>
          ))}
          {tooltipData.inBand && (
            <div className={styles.tooltipBand}>
              <span className={styles.tooltipBandBadge}>
                {tooltipData.inBand.tone === 'accent' ? 'Event' : 'Flex'}
              </span>
              {tooltipData.inBand.label}
            </div>
          )}
        </TooltipInPortal>
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
  const capH = Math.min(HANDLE_CAP_MAX_HEIGHT, height * HANDLE_CAP_HEIGHT_RATIO);
  const capY = (height - capH) / 2;
  const gripMid = capY + capH / 2;

  return (
    <g>
      {/* Invisible hit area */}
      <rect x={x - HANDLE_HIT_RECT_HALF} y={0} width={HANDLE_HIT_RECT_HALF * 2} height={height} fill="transparent" />
      {/* End cap */}
      <rect
        x={x - HANDLE_CAP_WIDTH / 2}
        y={capY}
        width={HANDLE_CAP_WIDTH}
        height={capH}
        rx={HANDLE_CAP_RADIUS}
        className={styles.selectionCap}
      />
      {/* Grip nubs (dots) */}
      <circle
        cx={x}
        cy={gripMid - GRIP_NUB_GAP}
        r={GRIP_NUB_RADIUS}
        className={styles.gripNub}
      />
      <circle cx={x} cy={gripMid} r={GRIP_NUB_RADIUS} className={styles.gripNub} />
      <circle
        cx={x}
        cy={gripMid + GRIP_NUB_GAP}
        r={GRIP_NUB_RADIUS}
        className={styles.gripNub}
      />
    </g>
  );
});
