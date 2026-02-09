'use client';

import { memo } from 'react';
import type { TimeRange } from '@/types/energy';
import { Button } from '@/components/Button/Button';
import styles from './QuickRangeBar.module.scss';

const HOUR_MS = 60 * 60 * 1000;

const PRESETS = [
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: 'All', hours: null },
] as const;

export interface QuickRangeBarProps {
  fullRange: TimeRange;
  activeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

function rangeForPreset(
  hours: number | null,
  fullRange: TimeRange,
): TimeRange {
  if (hours === null) return fullRange;
  const fromTs = Math.max(fullRange.fromTs, fullRange.toTs - hours * HOUR_MS);
  return { fromTs, toTs: fullRange.toTs };
}

function isPresetActive(
  hours: number | null,
  activeRange: TimeRange,
  fullRange: TimeRange,
): boolean {
  const preset = rangeForPreset(hours, fullRange);
  return preset.fromTs === activeRange.fromTs && preset.toTs === activeRange.toTs;
}

export const QuickRangeBar = memo(function QuickRangeBar({
  fullRange,
  activeRange,
  onRangeChange,
}: QuickRangeBarProps) {
  return (
    <div className={styles.bar}>
      {PRESETS.map(({ label, hours }) => {
        const active = isPresetActive(hours, activeRange, fullRange);
        return (
          <Button
            key={label}
            label={label}
            size="small"
            variant={active ? 'soft' : 'ghost'}
            onClick={() => onRangeChange(rangeForPreset(hours, fullRange))}
          />
        );
      })}
    </div>
  );
});
