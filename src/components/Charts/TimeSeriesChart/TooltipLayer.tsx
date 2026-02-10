import { memo } from 'react';
import type { TooltipData, ChartTone } from '@/types/chart';
import { formatDateTime } from '@/utils/format';
import styles from './TimeSeriesChart.module.scss';

/** Radius of the dot drawn at the hovered data point. */
const MARKER_RADIUS = 4;

interface TooltipCrosshairProps {
  /** Tooltip data for the currently hovered data point. */
  tooltipData: TooltipData;
  /** visx time scale mapping `Date` → pixel x. */
  xScale: (d: Date) => number;
  /** visx linear scale mapping value → pixel y. */
  yScale: (v: number) => number;
  /** Height of the chart plotting area in pixels. */
  innerHeight: number;
}

/**
 * Renders the vertical crosshair line and data-point dot that follow
 * the pointer.  Visible only when the tooltip is open and no drag is
 * in progress.
 */
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
  /** Tooltip data for the currently hovered data point. */
  tooltipData: TooltipData;
  /** Formats a numeric value for display in the tooltip. */
  formatTooltipValue: (v: number) => string;
}

/** Maps series tone tokens to CSS custom-property stroke colours. */
const TONE_COLOR: Record<ChartTone, string> = {
  accent: 'var(--accent-solid)',
  secondary: 'var(--secondary-solid)',
  positive: 'var(--success-solid)',
  negative: 'var(--error-solid)',
  warning: 'var(--warning-solid)',
  cyan: 'var(--cyan-solid)',
  purple: 'var(--purple-solid)',
  pink: 'var(--pink-solid)',
};

/**
 * Renders the tooltip popup content: timestamp, series values, and an
 * optional band badge.  Displayed inside a visx `TooltipInPortal`.
 *
 * When multiple series are visible, each value row shows a coloured dot
 * and the series label so the user can tell which line is which.
 */
export const TooltipContent = memo(function TooltipContent({
  tooltipData,
  formatTooltipValue,
}: TooltipContentProps) {
  const multiSeries = tooltipData.values.length > 1;

  return (
    <>
      <div className={styles.tooltipTime}>
        {formatDateTime(tooltipData.ts)}
      </div>
      <div className={styles.tooltipValues}>
        {tooltipData.values.map((v) => (
          <div key={v.seriesId} className={styles.tooltipValue}>
            {multiSeries && (
              <span className={styles.tooltipRow}>
                <span
                  className={styles.tooltipSwatch}
                  style={{ backgroundColor: TONE_COLOR[v.tone ?? 'accent'] }}
                  aria-hidden="true"
                />
                <span className={styles.tooltipLabel}>{v.label}</span>
              </span>
            )}
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
