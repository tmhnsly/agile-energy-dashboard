'use client';

import { memo } from 'react';
import { Button } from '@/components/Button/Button';
import styles from './QuickRangeBar.module.scss';

const PRESETS = [
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: 'All', hours: null },
] as const;

export interface QuickRangeBarProps {
  /** Label of the currently active preset (e.g. "6h"), or null if none match. */
  activePreset: string | null;
  /** Fired when a preset button is clicked. `null` means "All". */
  onPresetSelect: (hours: number | null) => void;
}

export const QuickRangeBar = memo(function QuickRangeBar({
  activePreset,
  onPresetSelect,
}: QuickRangeBarProps) {
  return (
    <div className={styles.bar}>
      {PRESETS.map(({ label, hours }) => (
        <Button
          key={label}
          label={label}
          size="small"
          variant={activePreset === label ? 'soft' : 'ghost'}
          onClick={() => onPresetSelect(hours)}
        />
      ))}
    </div>
  );
});
