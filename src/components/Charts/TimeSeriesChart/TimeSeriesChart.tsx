'use client';

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { useTooltipInPortal } from '@visx/tooltip';
import { startOfDay, addDays } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import type { TimeRange } from '@/types/energy';
import type { ChartSeries, ChartDataPoint } from '@/types/chart';
import type { ChartBand } from '@/types/chart';
import {
  formatTime,
  formatDayShort,
  formatDuration,
} from '@/utils/format';
import { lowerBound, upperBound } from '@/utils/binarySearch';
import { BandsLayer } from './BandsLayer';
import { SelectionOverlay } from './SelectionOverlay';
import { MinMaxMarkers } from './MinMaxMarkers';
import { TooltipCrosshair, TooltipContent } from './TooltipLayer';
import { useChartInteraction } from './useChartInteraction';
import styles from './TimeSeriesChart.module.scss';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

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

// Drag pill positioning
const PILL_EDGE_PAD = 80;
const PILL_TOP_OFFSET = 8;

export type ChartMargin = { top: number; right: number; bottom: number; left: number };

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

  /* ---- formatters (stable refs to avoid re-render cascades) ---- */
  const fmtYTickRef = useRef(formatYTickProp);
  useEffect(() => { fmtYTickRef.current = formatYTickProp; }, [formatYTickProp]);
  const fmtYTick = useCallback(
    (v: number) => (fmtYTickRef.current ?? defaultFormatYTick)(v),
    [],
  );
  const fmtXTick = formatXTickProp ?? formatTime;
  const fmtTooltipValue = formatTooltipValueProp ?? ((v: number) => v.toFixed(1));

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  /* ---- primary data (first series) ---- */
  const primaryData = useMemo(() => series[0]?.data ?? [], [series]);

  /* ---- auto-sized margins ---- */

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

  /* ---- interaction hook ---- */

  const {
    displayRange,
    displaySelLeftX,
    displaySelRightX,
    isFullSelection,
    hoveredBandId,
    isDragging,
    tooltip,
    handlers,
  } = useChartInteraction({
    svgRef,
    overlayRef,
    width,
    marginLeft: margin.left,
    marginTop: margin.top,
    fullRange,
    activeRange,
    xScale,
    yScale,
    series,
    primaryData,
    visibleBands,
    onRangeChange,
    onRangePreview,
  });

  /* ---- min/max stats (live during drag) ---- */

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
          <BandsLayer
            bands={visibleBands}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            xScale={xScale}
            selectedBandId={selectedBandId}
            hoveredBandId={hoveredBandId}
          />

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
          {showMinMaxMarkers && (
            <MinMaxMarkers
              min={displayStats.min}
              max={displayStats.max}
              xScale={xScale}
              yScale={yScale}
              formatValue={fmtTooltipValue}
            />
          )}

          {/* 6 — Selection overlay */}
          {!isFullSelection && (
            <SelectionOverlay
              leftX={displaySelLeftX}
              rightX={displaySelRightX}
              innerWidth={innerWidth}
              innerHeight={innerHeight}
            />
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
          {tooltip.tooltipOpen && tooltip.tooltipData && !isDragging && (
            <TooltipCrosshair
              tooltipData={tooltip.tooltipData}
              xScale={xScale}
              yScale={yScale}
              innerHeight={innerHeight}
            />
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
            {...handlers}
          />
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltip.tooltipOpen && tooltip.tooltipData && !isDragging && (
        <TooltipInPortal
          left={tooltip.tooltipLeft}
          top={tooltip.tooltipTop}
          className={styles.tooltip}
        >
          <TooltipContent
            tooltipData={tooltip.tooltipData}
            formatTooltipValue={fmtTooltipValue}
          />
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
