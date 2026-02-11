'use client';

import { memo, useCallback } from 'react';
import { ALL_HOUSEHOLD_KEYS, type HouseholdKey } from '@/types/energy';
import { HOUSEHOLD_THEMES } from '@/config/households';
import { Button } from '@/components/UI/Button/Button';
import styles from './HouseholdSelector.module.scss';

export interface HouseholdSelectorProps {
  selected: ReadonlySet<HouseholdKey>;
  onToggle: (next: ReadonlySet<HouseholdKey>) => void;
}

export const HouseholdSelector = memo(function HouseholdSelector({
  selected,
  onToggle,
}: HouseholdSelectorProps) {
  const allSelected = ALL_HOUSEHOLD_KEYS.every(k => selected.has(k));

  const handleToggle = useCallback((key: HouseholdKey) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
      if (next.size === 0) {
        onToggle(new Set(ALL_HOUSEHOLD_KEYS));
        return;
      }
    } else {
      next.add(key);
    }
    onToggle(next);
  }, [selected, onToggle]);

  const handleAllToggle = useCallback(() => {
    onToggle(new Set(ALL_HOUSEHOLD_KEYS));
  }, [onToggle]);

  return (
    <div className={styles.bar} role="group" aria-label="Household type">
      <Button
        label="Show All"
        size="small"
        color="mono"
        variant={allSelected ? 'soft' : 'ghost'}
        pressed={allSelected}
        onClick={handleAllToggle}
      />
      {ALL_HOUSEHOLD_KEYS.map((key) => (
        <Button
          key={key}
          label={HOUSEHOLD_THEMES[key].label}
          size="small"
          color={HOUSEHOLD_THEMES[key].tone}
          variant={selected.has(key) ? 'soft' : 'ghost'}
          pressed={selected.has(key)}
          onClick={() => handleToggle(key)}
        />
      ))}
    </div>
  );
});
