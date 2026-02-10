import { memo } from 'react';
import type { ChartDataPoint } from '@/types/chart';
import styles from './TimeSeriesChart.module.scss';

/** Radius of the min/max marker circles. */
const MARKER_RADIUS = 4;
/** Vertical offset (px) for the "min" label below its marker. */
const MIN_LABEL_OFFSET_Y = 16;
/** Vertical offset (px) for the "max" label above its marker. */
const MAX_LABEL_OFFSET_Y = 10;

interface MinMaxMarkersProps {
  /** Data point with the lowest value in the visible range, or `null`. */
  min: ChartDataPoint | null;
  /** Data point with the highest value in the visible range, or `null`. */
  max: ChartDataPoint | null;
  /** visx time scale mapping `Date` → pixel x. */
  xScale: (d: Date) => number;
  /** visx linear scale mapping value → pixel y. */
  yScale: (v: number) => number;
  /** Formats a numeric value for the label text. */
  formatValue: (v: number) => string;
}

/**
 * Renders coloured circle markers and value labels at the minimum and
 * maximum data points within the current selection.  Updates live
 * during drag to reflect the previewed range.
 */
export const MinMaxMarkers = memo(function MinMaxMarkers({
  min,
  max,
  xScale,
  yScale,
  formatValue,
}: MinMaxMarkersProps) {
  return (
    <>
      {min && (
        <g>
          <circle
            cx={xScale(new Date(min.ts))}
            cy={yScale(min.value)}
            r={MARKER_RADIUS}
            className={styles.minMarker}
          />
          <text
            x={xScale(new Date(min.ts))}
            y={yScale(min.value) + MIN_LABEL_OFFSET_Y}
            className={styles.minMaxLabel}
          >
            {formatValue(min.value)}
          </text>
        </g>
      )}
      {max && (
        <g>
          <circle
            cx={xScale(new Date(max.ts))}
            cy={yScale(max.value)}
            r={MARKER_RADIUS}
            className={styles.maxMarker}
          />
          <text
            x={xScale(new Date(max.ts))}
            y={yScale(max.value) - MAX_LABEL_OFFSET_Y}
            className={styles.maxMaxLabel}
          >
            {formatValue(max.value)}
          </text>
        </g>
      )}
    </>
  );
});
