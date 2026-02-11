/** Colour token shared across series, bands, and tooltip value rows. */
export type ChartTone = 'accent' | 'secondary' | 'positive' | 'negative' | 'warning';

/** A single data point on a time-series chart. */
export interface ChartDataPoint {
  /** Timestamp. */
  ts: number;
  /** Numeric value (units depend on the series). */
  value: number;
}

/** A line series rendered on a `TimeSeriesChart`. */
export interface ChartSeries {
  id: string;
  /** Name shown in legends and tooltips. */
  label: string;
  /** Data points, sorted ascending by timestamp. */
  data: ChartDataPoint[];
  /** Colour token for the line stroke. */
  tone?: ChartTone;
}

/**
 * A highlighted time window rendered as a translucent overlay behind the
 * series lines (e.g. a flex event or peak-rate period).
 */
export interface ChartBand {
  id: string;
  /** Start timestamp. */
  startTs: number;
  /** End timestamp. */
  endTs: number;
  /** Label shown in the tooltip when hovering inside the band. */
  label?: string;
  /** Colour token for the band fill. */
  tone?: ChartTone;
}

/** Data passed to the chart tooltip when hovering over a data point. */
export interface TooltipData {
  /** Timestamp of the nearest data point. */
  ts: number;
  /** Values from each visible series at the hovered timestamp. */
  values: Array<{ seriesId: string; label: string; value: number; tone?: ChartTone }>;
  /** The band the hovered point falls within, if any. */
  inBand: ChartBand | null;
}
