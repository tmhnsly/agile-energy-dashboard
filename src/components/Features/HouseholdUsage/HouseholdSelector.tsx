'use client';

import { memo, useCallback } from 'react';
import type { HouseholdKey } from '@/types/energy';
import type { ButtonColor } from '@/components/UI/Button/Button';
import { Button } from '@/components/UI/Button/Button';
import styles from './HouseholdSelector.module.scss';

const ALL_KEYS: HouseholdKey[] = ['standard', 'heatPump', 'heatPumpBattery'];

const HOUSEHOLD_OPTIONS: { label: string; key: HouseholdKey; color: ButtonColor }[] = [
  { label: 'Standard', key: 'standard', color: 'accent' },
  { label: 'Heat Pump', key: 'heatPump', color: 'secondary' },
  { label: 'Heat Pump + Battery', key: 'heatPumpBattery', color: 'success' },
];

export interface HouseholdSelectorProps {
  selected: ReadonlySet<HouseholdKey>;
  onToggle: (next: ReadonlySet<HouseholdKey>) => void;
}

export const HouseholdSelector = memo(function HouseholdSelector({
  selected,
  onToggle,
}: HouseholdSelectorProps) {
  const allOn = ALL_KEYS.every(k => selected.has(k));

  const handleToggle = useCallback((key: HouseholdKey) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
      // Last one deselected — re-enable all
      if (next.size === 0) {
        onToggle(new Set(ALL_KEYS));
        return;
      }
    } else {
      next.add(key);
    }
    onToggle(next);
  }, [selected, onToggle]);

  const handleAllToggle = useCallback(() => {
    onToggle(new Set(ALL_KEYS));
  }, [onToggle]);

  return (
    <div className={styles.bar} role="group" aria-label="Household type">
      <Button
        label="Show All"
        size="small"
        color="mono"
        variant={allOn ? 'soft' : 'ghost'}
        pressed={allOn}
        onClick={handleAllToggle}
      />
      {HOUSEHOLD_OPTIONS.map(({ label, key, color }) => (
        <Button
          key={key}
          label={label}
          size="small"
          color={color}
          variant={selected.has(key) ? 'soft' : 'ghost'}
          pressed={selected.has(key)}
          onClick={() => handleToggle(key)}
        />
      ))}
    </div>
  );
});
