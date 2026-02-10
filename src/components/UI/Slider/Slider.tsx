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
  'aria-label': ariaLabel,
}: SliderProps) => {
  return (
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
      <RadixSlider.Track className={styles.track}>
        <RadixSlider.Range className={styles.range} />
      </RadixSlider.Track>
      <RadixSlider.Thumb className={styles.thumb} aria-label={ariaLabel} />
    </RadixSlider.Root>
  );
};
