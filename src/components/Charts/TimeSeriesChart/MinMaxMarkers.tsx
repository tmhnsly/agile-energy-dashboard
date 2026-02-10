import { memo } from 'react';
import type { ChartDataPoint } from '@/types/chart';
import styles from './TimeSeriesChart.module.scss';

const MARKER_RADIUS = 4;
const MIN_LABEL_OFFSET_Y = 16;
const MAX_LABEL_OFFSET_Y = 10;

interface MinMaxMarkersProps {
  min: ChartDataPoint | null;
  max: ChartDataPoint | null;
  xScale: (d: Date) => number;
  yScale: (v: number) => number;
  formatValue: (v: number) => string;
}

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
