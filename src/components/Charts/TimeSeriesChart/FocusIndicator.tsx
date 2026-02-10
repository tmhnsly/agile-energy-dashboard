import { memo } from 'react';
import styles from './TimeSeriesChart.module.scss';

interface FocusIndicatorProps {
  x: number;
  y: number;
  isVisible: boolean;
}

/** Pulsing ring rendered at the keyboard-focused data point. */
export const FocusIndicator = memo(function FocusIndicator({
  x,
  y,
  isVisible,
}: FocusIndicatorProps) {
  if (!isVisible) return null;

  return (
    <circle
      cx={x}
      cy={y}
      r={6}
      className={styles.focusRing}
    />
  );
});
