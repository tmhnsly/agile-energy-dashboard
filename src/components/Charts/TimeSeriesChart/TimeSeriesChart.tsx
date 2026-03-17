'use client';

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { FIVE_MINUTE_MS } from '@/utils/constants';
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
import { clamp } from '@/utils/math';
import { TONE_VARS } from '@/config/households';
import { BandsLayer } from './BandsLayer';
import { SelectionOverlay } from './SelectionOverlay';
import { FocusIndicator } from './FocusIndicator';
import { MinMaxMarkers } from './MinMaxMarkers';
import { TooltipCrosshair, TooltipContent } from './TooltipLayer';
import type { TooltipData } from '@/types/chart';
import { bisectNearest } from '@/utils/binarySearch';
import { defaultFormatYTick } from '../utils';
import { useChartInteraction } from '../hooks/useChartInteraction';
import { useChartKeyboardNav } from '../hooks/useChartKeyboardNav';
import type { ChartRange } from '../hooks/useChartInteraction';
import { useChartScales, Y_TICK_COUNT } from './useChartScales';
import { useMinMaxStats } from './useMinMaxStats';
import { useDayBoundaries } from './useDayBoundaries';
import type { ChartMargin } from './useChartScales';
import styles from './TimeSeriesChart.module.scss';

/** Draws a line that animates in via stroke-dashoffset on first render. */
function AnimatedLinePath({
  data,
  xScale,
  yScale,
  stroke,
  delay,
}: {
  data: { ts: number; value: number }[];
  xScale: (d: Date) => number;
  yScale: (v: number) => number;
  stroke: string;
  delay: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState<number | null>(null);

  useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength());
    }
  }, [data, xScale, yScale]);

  return (
    <LinePath
      innerRef={pathRef}
      data={data}
      x={(d) => xScale(new Date(d.ts))}
      y={(d) => yScale(d.value)}
      curve={curveMonotoneX}
      className={`${styles.seriesLine} ${length != null ? styles.seriesLineAnimated : ''}`}
      style={{
        stroke,
        '--line-length': length != null ? length : undefined,
        '--line-delay': `${delay}s`,
      } as React.CSSProperties}
    />
  );
}

/** Maximum number of x-axis tick labels. */
const MAX_X_TICKS = 8;
/** Minimum horizontal spacing (px) between x-axis ticks. */
const X_TICK_MIN_SPACING_PX = 80;
/** Minimum distance (px) from the viewport edge for the drag pill. */
const PILL_EDGE_PAD = 80;
/** Vertical offset (px) of the drag pill from the top of the chart area. */
const PILL_TOP_OFFSET = 8;

/** Minimum selection duration (ms) — prevents zero-width selections. */
const MIN_SELECTION_MS = FIVE_MINUTE_MS;

export type { ChartMargin };

/** Snap a timestamp to the nearest 5-minute boundary. */
function snapToFiveMinutes(ts: number): number {
  return Math.round(ts / FIVE_MINUTE_MS) * FIVE_MINUTE_MS;
}

function defaultFormatTooltipValue(v: number): string {
  return v.toFixed(1);
}

const AXIS_BOTTOM_TICK_LABEL_PROPS = {
  fill: 'var(--mono-text-low-contrast)',
  fontSize: 'var(--text-sm)',
  textAnchor: 'middle' as const,
  style: { fontVariantNumeric: 'tabular-nums' } as React.CSSProperties,
};

const AXIS_LEFT_TICK_LABEL_PROPS = {
  fill: 'var(--mono-text-low-contrast)',
  fontSize: 'var(--text-sm)',
  textAnchor: 'end' as const,
  style: { fontVariantNumeric: 'tabular-nums' } as React.CSSProperties,
  dx: '-0.25em',
  dy: '0.33em',
};

const EMPTY_BANDS: ChartBand[] = [];


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
  /** Longer accessible description for the chart (referenced via aria-describedby). */
  ariaDescription?: string;
  /** Show min/max markers on the primary series. Default: true */
  showMinMaxMarkers?: boolean;
}

export const TimeSeriesChart = ({
  series,
  bands,
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
  ariaDescription,
  showMinMaxMarkers = true,
}: TimeSeriesChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const overlayRef = useRef<SVGRectElement>(null);
  const pointerFocusingRef = useRef(false);

  const stableBands = bands ?? EMPTY_BANDS;

  // Stable refs to avoid re-render cascades from formatter prop changes
  const fmtYTickRef = useRef(formatYTickProp);
  useEffect(() => { fmtYTickRef.current = formatYTickProp; }, [formatYTickProp]);
  const fmtYTick = useCallback(
    (v: number) => (fmtYTickRef.current ?? defaultFormatYTick)(v),
    [],
  );
  const fmtXTick = formatXTickProp ?? formatTime;
  const fmtTooltipValueRef = useRef(formatTooltipValueProp);
  useEffect(() => { fmtTooltipValueRef.current = formatTooltipValueProp; }, [formatTooltipValueProp]);
  const fmtTooltipValue = useCallback(
    (v: number) => (fmtTooltipValueRef.current ?? defaultFormatTooltipValue)(v),
    [],
  );

  const primaryData = useMemo(() => series[0]?.data ?? [], [series]);

  const { margin, innerWidth, innerHeight, xScale, yScale, yTicks } = useChartScales({
    series,
    fullRange,
    width,
    height,
    margin: marginProp,
    formatYTick: formatYTickProp,
  });

  const visibleBands = useMemo(
    () =>
      stableBands.filter(
        (b) => b.endTs >= fullRange.fromTs && b.startTs <= fullRange.toTs,
      ),
    [stableBands, fullRange],
  );

  const selectedBandId = useMemo(() => {
    const m = visibleBands.find(
      (b) => b.startTs === activeRange.fromTs && b.endTs === activeRange.toTs,
    );
    return m?.id ?? null;
  }, [visibleBands, activeRange]);

  const dayBoundaries = useDayBoundaries(fullRange);

  const {
    focusedIndex,
    isKeyboardActive,
    selectionStart,
    announcement,
    dismissKeyboard,
    activateKeyboard,
    handleKeyDown,
  } = useChartKeyboardNav({
    dataLength: primaryData.length,
    onSelect: useCallback(
      (fromIdx: number, toIdx: number) => {
        onRangeChange({ fromTs: primaryData[fromIdx].ts, toTs: primaryData[toIdx].ts });
      },
      [primaryData, onRangeChange],
    ),
    onReset: useCallback(
      () => onRangeChange(fullRange),
      [onRangeChange, fullRange],
    ),
    formatPoint: useCallback(
      (idx: number) => {
        const p = primaryData[idx];
        return p ? `${formatTime(p.ts)}, ${fmtTooltipValue(p.value)}` : '';
      },
      [primaryData, fmtTooltipValue],
    ),
    formatSelection: useCallback(
      (fromIdx: number, toIdx: number) =>
        `Selected ${formatTime(primaryData[fromIdx]?.ts ?? 0)} to ${formatTime(primaryData[toIdx]?.ts ?? 0)}`,
      [primaryData],
    ),
  });

  const chartFullRange = useMemo<ChartRange>(
    () => ({ from: fullRange.fromTs, to: fullRange.toTs }),
    [fullRange],
  );
  const chartActiveRange = useMemo<ChartRange>(
    () => ({ from: activeRange.fromTs, to: activeRange.toTs }),
    [activeRange],
  );
  const chartBands = useMemo(
    () => visibleBands.map((b) => ({ id: b.id, from: b.startTs, to: b.endTs })),
    [visibleBands],
  );

  const pixelToValue = useCallback(
    (px: number) => xScale.invert(px).getTime(),
    [xScale],
  );
  const valueToPixel = useCallback(
    (v: number) => xScale(new Date(v)),
    [xScale],
  );

  const buildTooltipData = useCallback(
    (domainValue: number): { data: TooltipData; left: number; top: number } | null => {
      if (primaryData.length === 0) return null;
      const idx = bisectNearest(primaryData, domainValue);
      if (idx < 0) return null;
      const closest = primaryData[idx];

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

      return {
        data: { ts: closest.ts, values, inBand },
        left: xScale(new Date(closest.ts)) + margin.left,
        top: yScale(closest.value) + margin.top,
      };
    },
    [primaryData, series, visibleBands, xScale, yScale, margin.left, margin.top],
  );

  const handleRangeChange = useCallback(
    (range: ChartRange) => onRangeChange({ fromTs: range.from, toTs: range.to }),
    [onRangeChange],
  );

  const handleRangePreview = useCallback(
    (range: ChartRange | null) => {
      onRangePreview?.(range ? { fromTs: range.from, toTs: range.to } : null);
    },
    [onRangePreview],
  );

  const {
    displayRange: chartDisplayRange,
    displaySelLeftX,
    displaySelRightX,
    isFullSelection,
    hoveredBandId,
    isDragging,
    tooltip,
    handlers,
  } = useChartInteraction<TooltipData>({
    svgRef,
    overlayRef,
    width,
    marginLeft: margin.left,
    marginTop: margin.top,
    fullRange: chartFullRange,
    activeRange: chartActiveRange,
    pixelToValue,
    valueToPixel,
    buildTooltipData,
    bands: chartBands,
    minSelectionSpan: MIN_SELECTION_MS,
    snapValue: snapToFiveMinutes,
    onRangeChange: handleRangeChange,
    onRangePreview: handleRangePreview,
    onPointerActivity: dismissKeyboard,
  });

  const displayRange: TimeRange = useMemo(
    () => ({ fromTs: chartDisplayRange.from, toTs: chartDisplayRange.to }),
    [chartDisplayRange],
  );

  const displayStats = useMinMaxStats(primaryData, displayRange, showMinMaxMarkers);

  const pillLeft = margin.left + (displaySelLeftX + displaySelRightX) / 2;
  const pillLeftClamped = clamp(pillLeft, PILL_EDGE_PAD, width - PILL_EDGE_PAD);
  const pillTop = margin.top + PILL_TOP_OFFSET;

  const keyboardTooltipData: TooltipData | null = useMemo(() => {
    const point = primaryData[focusedIndex];
    if (!point) return null;
    return {
      ts: point.ts,
      values: series.map((s) => {
        const p = s.data[focusedIndex];
        return {
          seriesId: s.id,
          label: s.label,
          value: p?.value ?? 0,
          tone: s.tone,
        };
      }),
      inBand: null,
    };
  }, [primaryData, focusedIndex, series]);

  if (width < 10 || height < 10) return null;

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? 'chart-desc' : undefined}
        style={{ touchAction: 'pan-y' }}
      >
        {ariaDescription && <desc id="chart-desc">{ariaDescription}</desc>}
        <Group left={margin.left} top={margin.top}>
          {/* Alternating horizontal stripes */}
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

          {/* Horizontal gridlines */}
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

          {/* Day boundaries */}
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

          {/* Bands */}
          <BandsLayer
            bands={visibleBands}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            xScale={xScale}
            selectedBandId={selectedBandId}
            hoveredBandId={hoveredBandId}
          />

          {/* Series lines */}
          {series.map((s, i) => {
            const stroke = TONE_VARS[s.tone ?? 'accent'];
            return (
              <AnimatedLinePath
                key={s.id}
                data={s.data}
                xScale={xScale}
                yScale={yScale}
                stroke={stroke}
                delay={i * 0.15}
              />
            );
          })}

          {/* Min/max markers (update live during drag) */}
          {showMinMaxMarkers && (
            <MinMaxMarkers
              min={displayStats.min}
              max={displayStats.max}
              xScale={xScale}
              yScale={yScale}
              formatValue={fmtTooltipValue}
            />
          )}

          {/* Axes — rendered before selection so drag handles paint above axis lines */}
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

          {/* Selection overlay */}
          {!isFullSelection && (
            <SelectionOverlay
              leftX={displaySelLeftX}
              rightX={displaySelRightX}
              innerWidth={innerWidth}
              innerHeight={innerHeight}
            />
          )}

          {/* Keyboard focus indicator */}
          {primaryData.length > 0 && (
            <FocusIndicator
              x={xScale(new Date(primaryData[focusedIndex]?.ts ?? 0))}
              y={yScale(primaryData[focusedIndex]?.value ?? 0)}
              isVisible={isKeyboardActive}
            />
          )}

          {/* Selection start marker (placed via Space key) */}
          {isKeyboardActive && selectionStart != null && primaryData[selectionStart] && (
            <g>
              <line
                x1={xScale(new Date(primaryData[selectionStart].ts))}
                y1={0}
                x2={xScale(new Date(primaryData[selectionStart].ts))}
                y2={innerHeight}
                className={styles.selectionStartLine}
              />
              <circle
                cx={xScale(new Date(primaryData[selectionStart].ts))}
                cy={yScale(primaryData[selectionStart].value)}
                r={4}
                className={styles.selectionStartDot}
              />
            </g>
          )}

          {/* Tooltip crosshair — hidden during drag */}
          {tooltip.tooltipOpen && tooltip.tooltipData && !isDragging && (
            <TooltipCrosshair
              tooltipData={tooltip.tooltipData}
              xScale={xScale}
              yScale={yScale}
              innerHeight={innerHeight}
            />
          )}

          {/* Interaction overlay — must be last so it captures all pointer events */}
          <rect
            ref={overlayRef}
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            className={styles.interactionOverlay}
            data-cursor="crosshair"
            data-keyboard={isKeyboardActive ? 'true' : 'false'}
            tabIndex={0}
            role="application"
            aria-label="Time series chart. Use arrow keys to navigate data points. Press Space to set range start, then Space again to set range end. Escape to reset."
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (!pointerFocusingRef.current) {
                activateKeyboard();
              }
              pointerFocusingRef.current = false;
            }}
            onBlur={() => {
              dismissKeyboard();
            }}
            onPointerDown={(e) => {
              pointerFocusingRef.current = true;
              handlers.onPointerDown(e);
            }}
            onPointerMove={handlers.onPointerMove}
            onPointerUp={handlers.onPointerUp}
            onPointerCancel={handlers.onPointerCancel}
            onPointerLeave={handlers.onPointerLeave}
          />
        </Group>
      </svg>

      {/* Pointer tooltip — flips at container edges */}
      {tooltip.tooltipOpen && tooltip.tooltipData && !isDragging && !isKeyboardActive && (
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

      {/* Keyboard tooltip */}
      {isKeyboardActive && keyboardTooltipData && primaryData[focusedIndex] && (
        <TooltipWithBounds
          left={xScale(new Date(primaryData[focusedIndex].ts)) + margin.left}
          top={yScale(primaryData[focusedIndex].value) + margin.top}
          className={styles.tooltip}
          unstyled
          applyPositionStyle
        >
          <TooltipContent
            tooltipData={keyboardTooltipData}
            formatTooltipValue={fmtTooltipValue}
          />
        </TooltipWithBounds>
      )}

      {/* Screen-reader live region */}
      <div aria-live="polite" className={styles.srOnly}>
        {announcement}
      </div>

      {/* Drag range pill — shows selected time window during drag */}
      {isDragging && (
        <div
          className={styles.dragPill}
          style={{ left: pillLeftClamped, top: pillTop }}
        >
          <span>{formatTime(displayRange.fromTs)}</span>
          <span className={styles.dragPillSep}>&ndash;</span>
          <span>{formatTime(displayRange.toTs)}</span>
          <span className={styles.dragPillDuration}>
            ({formatDuration(displayRange.fromTs, displayRange.toTs)})
          </span>
        </div>
      )}
    </div>
  );
};
