'use client';

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { TooltipWithBounds } from '@visx/tooltip';
import type { TimeRange } from '@/types/energy';
import type { ChartSeries } from '@/types/chart';
import type { ChartBand } from '@/types/chart';
import {
  formatTime,
  formatDayShort,
  formatDuration,
} from '@/utils/format';
import { BandsLayer } from './BandsLayer';
import { SelectionOverlay } from './SelectionOverlay';
import { MinMaxMarkers } from './MinMaxMarkers';
import { TooltipCrosshair, TooltipContent } from './TooltipLayer';
import { useChartInteraction } from './useChartInteraction';
import { useChartScales } from './useChartScales';
import { useMinMaxStats } from './useMinMaxStats';
import { useDayBoundaries } from './useDayBoundaries';
import type { ChartMargin } from './useChartScales';
import styles from './TimeSeriesChart.module.scss';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** Half-hour in milliseconds — used to snap the drag pill readout. */
const HALF_HOUR_MS = 30 * 60_000;

/** Maximum number of x-axis tick labels. */
const MAX_X_TICKS = 8;
/** Minimum horizontal spacing (px) between x-axis ticks. */
const X_TICK_MIN_SPACING_PX = 80;
/** Number of ticks on the y-axis. */
const Y_TICK_COUNT = 5;

/** Minimum distance (px) from the viewport edge for the drag pill. */
const PILL_EDGE_PAD = 80;
/** Vertical offset (px) of the drag pill from the top of the chart area. */
const PILL_TOP_OFFSET = 8;

export type { ChartMargin };

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function snapToHalfHour(ts: number): number {
  return Math.round(ts / HALF_HOUR_MS) * HALF_HOUR_MS;
}

function defaultFormatYTick(v: number): string {
  return String(v);
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

/** Maps series tone tokens to CSS custom-property stroke colours. */
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

  /* ---- primary data (first series) ---- */
  const primaryData = useMemo(() => series[0]?.data ?? [], [series]);

  /* ---- scales & layout ---- */

  const { margin, innerWidth, innerHeight, xScale, yScale, yTicks } = useChartScales({
    series,
    fullRange,
    width,
    height,
    margin: marginProp,
    formatYTick: formatYTickProp,
  });

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

  const dayBoundaries = useDayBoundaries(fullRange);

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

  const displayStats = useMinMaxStats(primaryData, displayRange, showMinMaxMarkers);

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
    <div className={styles.container}>
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

      {/* Tooltip (inline with bounds detection — flips at container edges) */}
      {tooltip.tooltipOpen && tooltip.tooltipData && !isDragging && (
        <TooltipWithBounds
          left={tooltip.tooltipLeft}
          top={tooltip.tooltipTop}
          className={styles.tooltip}
          unstyled
          applyPositionStyle
        >
          <TooltipContent
            tooltipData={tooltip.tooltipData}
            formatTooltipValue={fmtTooltipValue}
          />
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
