'use client';

import { memo } from 'react';
import { Button } from '@/components/UI/Button/Button';
import styles from './DurationPresetBar.module.scss';

const PRESETS = [
  { label: 'Show All', hours: null },
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
] as const;

export interface DurationPresetBarProps {
  /** Label of the currently active preset (e.g. "6h"), or null if none match. */
  activePreset: string | null;
  /** Fired when a preset button is clicked. `null` means "All". */
  onPresetSelect: (hours: number | null) => void;
}

export const DurationPresetBar = memo(function DurationPresetBar({
  activePreset,
  onPresetSelect,
}: DurationPresetBarProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Duration presets">
      {PRESETS.map(({ label, hours }) => (
        <Button
          key={label}
          label={label}
          size="small"
          variant={activePreset === label ? 'soft' : 'ghost'}
          color={hours === null ? 'mono' : 'accent'}
          onClick={() => onPresetSelect(hours)}
        />
      ))}
    </div>
  );
});
