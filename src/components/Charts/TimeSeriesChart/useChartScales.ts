import { useMemo } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import type { TimeRange } from '@/types/energy';
import type { ChartSeries } from '@/types/chart';

/** Estimated width of a single character for y-axis label measurement. */
const CHAR_WIDTH_PX = 7.5;
/** Padding between the longest y-axis label and the chart area. */
const AXIS_LABEL_PAD = 12;
/** Number of ticks to show on the y-axis. */
export const Y_TICK_COUNT = 5;
/** Temporary scale range used only to measure y-axis tick label widths. */
const TEMP_SCALE_RANGE: [number, number] = [100, 0];

const DEFAULT_MARGIN_TOP = 12;
const DEFAULT_MARGIN_RIGHT = 4;
const DEFAULT_MARGIN_BOTTOM = 28;

export type ChartMargin = { top: number; right: number; bottom: number; left: number };

function estimateTextWidth(text: string): number {
  return text.length * CHAR_WIDTH_PX;
}

function defaultFormatYTick(v: number): string {
  return String(v);
}

export function computeYDomain(series: ChartSeries[]): [number, number] {
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
}

export function computeAutoLeftMargin(
  yDomain: [number, number],
  formatYTick?: (value: number) => string,
): number {
  const fmt = formatYTick ?? defaultFormatYTick;
  const tempScale = scaleLinear({ domain: yDomain, range: TEMP_SCALE_RANGE, nice: true });
  const ticks = tempScale.ticks(Y_TICK_COUNT);
  const maxWidth = Math.max(...ticks.map((t) => estimateTextWidth(fmt(t))));
  return Math.ceil(maxWidth + AXIS_LABEL_PAD);
}

interface UseChartScalesOptions {
  series: ChartSeries[];
  fullRange: TimeRange;
  width: number;
  height: number;
  margin?: Partial<ChartMargin>;
  formatYTick?: (value: number) => string;
}

/**
 * Computes chart scales, y-domain, auto-sized left margin, and derived
 * layout dimensions from the raw series data and container size.
 */
export function useChartScales({
  series,
  fullRange,
  width,
  height,
  margin: marginProp,
  formatYTick: formatYTickProp,
}: UseChartScalesOptions) {
  const yDomain = useMemo(() => computeYDomain(series), [series]);

  const autoLeftMargin = useMemo(
    () => computeAutoLeftMargin(yDomain, formatYTickProp),
    [yDomain, formatYTickProp],
  );

  const margin: ChartMargin = useMemo(() => ({
    top: marginProp?.top ?? DEFAULT_MARGIN_TOP,
    right: marginProp?.right ?? DEFAULT_MARGIN_RIGHT,
    bottom: marginProp?.bottom ?? DEFAULT_MARGIN_BOTTOM,
    left: marginProp?.left ?? autoLeftMargin,
  }), [marginProp, autoLeftMargin]);

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

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

  return { margin, innerWidth, innerHeight, xScale, yScale, yTicks };
}
