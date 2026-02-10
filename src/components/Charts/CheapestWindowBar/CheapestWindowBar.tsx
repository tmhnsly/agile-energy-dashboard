'use client';

import { memo } from 'react';
import { Button } from '@/components/UI/Button/Button';
import styles from './CheapestWindowBar.module.scss';

const PRESETS = [
  { label: 'All', hours: null },
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
] as const;

export interface CheapestWindowBarProps {
  /** Label of the currently active preset (e.g. "6h"), or null if none match. */
  activePreset: string | null;
  /** Fired when a preset button is clicked. `null` means "All". */
  onPresetSelect: (hours: number | null) => void;
}

export const CheapestWindowBar = memo(function CheapestWindowBar({
  activePreset,
  onPresetSelect,
}: CheapestWindowBarProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Cheapest window presets">
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
