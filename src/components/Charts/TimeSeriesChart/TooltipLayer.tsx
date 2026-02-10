import { memo } from 'react';
import type { ChartBand } from '@/types/chart';
import { formatDateTime } from '@/utils/format';
import styles from './TimeSeriesChart.module.scss';

const MARKER_RADIUS = 4;

interface TooltipData {
  ts: number;
  values: Array<{ seriesId: string; label: string; value: number; tone?: string }>;
  inBand: ChartBand | null;
}

interface TooltipCrosshairProps {
  tooltipData: TooltipData;
  xScale: (d: Date) => number;
  yScale: (v: number) => number;
  innerHeight: number;
}

export const TooltipCrosshair = memo(function TooltipCrosshair({
  tooltipData,
  xScale,
  yScale,
  innerHeight,
}: TooltipCrosshairProps) {
  return (
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
  );
});

interface TooltipContentProps {
  tooltipData: TooltipData;
  formatTooltipValue: (v: number) => string;
}

export const TooltipContent = memo(function TooltipContent({
  tooltipData,
  formatTooltipValue,
}: TooltipContentProps) {
  return (
    <>
      <div className={styles.tooltipTime}>
        {formatDateTime(tooltipData.ts)}
      </div>
      <div className={styles.tooltipValues}>
        {tooltipData.values.map((v) => (
          <div key={v.seriesId} className={styles.tooltipValue}>
            {formatTooltipValue(v.value)}
          </div>
        ))}
      </div>
      {tooltipData.inBand && (
        <div className={styles.tooltipBand}>
          <span className={styles.tooltipBandBadge}>
            {tooltipData.inBand.tone === 'accent' ? 'Event' : 'Flex'}
          </span>
          {tooltipData.inBand.label}
        </div>
      )}
    </>
  );
});
