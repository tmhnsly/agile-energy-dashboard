'use client';

import * as RadixSlider from '@radix-ui/react-slider';
import styles from './Slider.module.scss';

interface SliderProps {
  id?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Interval between major tick marks (e.g. 0.5). Omit to hide ticks. Capped at 20. */
  tickInterval?: number;
  /** Optional CSS gradient string for the track (e.g. 'linear-gradient(to right, grey, green)'). */
  trackGradient?: string;
  /** Optional inline styles on the wrapper — use to set CSS custom properties like --slider-thumb-border. */
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export const Slider = ({
  id,
  min,
  max,
  step,
  value,
  onChange,
  disabled = false,
  tickInterval,
  trackGradient,
  style,
  'aria-label': ariaLabel,
}: SliderProps) => {
  const range = max - min;

  // Build tick positions as percentage offsets (Math.round avoids
  // floating-point drift that would drop the last tick).
  let ticks: number[] = [];
  if (tickInterval && range > 0) {
    const count = Math.round(range / tickInterval);
    if (count > 0 && count <= 20) {
      for (let i = 0; i <= count; i++) {
        ticks.push((i * tickInterval) / range);
      }
    }
  }

  return (
    <div className={styles.wrapper} style={style}>
      <RadixSlider.Root
        id={id}
        className={styles.root}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      >
        <RadixSlider.Track
          className={styles.track}
          style={trackGradient ? { background: trackGradient } : undefined}
        >
          <RadixSlider.Range className={styles.range} />
        </RadixSlider.Track>
        <RadixSlider.Thumb className={styles.thumb} aria-label={ariaLabel} />
        {ticks.length > 0 && (
          <div className={styles.ticks} aria-hidden>
            {ticks.map((pct, i) => (
              <span
                key={i}
                className={styles.tick}
                style={{ left: `${pct * 100}%` }}
              />
            ))}
          </div>
        )}
      </RadixSlider.Root>
    </div>
  );
};
