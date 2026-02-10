'use client';

import { useMemo } from 'react';
import type { PricePoint, HouseholdUsageRow, FlexEvent, HouseholdKey } from '@/types/energy';
import { ALL_HOUSEHOLD_KEYS } from '@/types/energy';
import { Button, type ButtonColor } from '@/components/UI/Button/Button';
import { formatDateTime } from '@/utils/format';
import { computeFlexEarnings, computeDailyCost } from './computeFlexInsights';
import { InsightCardList } from './InsightCardList/InsightCardList';
import styles from './FlexInsightsPanel.module.scss';

const HOUSEHOLD_CONFIG: Record<HouseholdKey, { label: string; color: ButtonColor }> = {
  standard: { label: 'Standard', color: 'accent' },
  heatPump: { label: 'Heat Pump', color: 'cyan' },
  heatPumpBattery: { label: 'Heat Pump + Battery', color: 'purple' },
};

export interface FlexInsightsPanelProps {
  prices: PricePoint[];
  usage: HouseholdUsageRow[];
  flexEvents: FlexEvent[];
  household: HouseholdKey;
  onHouseholdChange: (key: HouseholdKey) => void;
}

export const FlexInsightsPanel = ({
  prices,
  usage,
  flexEvents,
  household,
  onHouseholdChange,
}: FlexInsightsPanelProps) => {
  const dailyCosts = useMemo(
    () =>
      Object.fromEntries(
        ALL_HOUSEHOLD_KEYS.map((k) => [k, computeDailyCost(usage, prices, k)]),
      ) as Record<HouseholdKey, number>,
    [usage, prices],
  );

  const flexEarnings = useMemo(
    () => computeFlexEarnings(flexEvents, usage, household),
    [flexEvents, usage, household],
  );

  const rangeSummary = useMemo(() => {
    if (usage.length === 0) return null;
    const from = formatDateTime(usage[0].ts);
    const to = formatDateTime(usage[usage.length - 1].ts);
    return `${from} – ${to}`;
  }, [usage]);

  return (
    <div className={styles.content}>
      <div className={styles.headerRow}>
        <div className={styles.headerGroup}>
          <h2 className={styles.title}>Flexibility Insights</h2>
          <p className={styles.subtitle}>
            Opportunities to save by shifting usage to cheaper periods.
            {rangeSummary && <> {rangeSummary}</>}
          </p>
        </div>
        <div className={styles.selector} role="group" aria-label="Household type">
          {ALL_HOUSEHOLD_KEYS.map((key) => (
            <Button
              key={key}
              label={HOUSEHOLD_CONFIG[key].label}
              size="small"
              color={HOUSEHOLD_CONFIG[key].color}
              variant={key === household ? 'soft' : 'ghost'}
              pressed={key === household}
              onClick={() => onHouseholdChange(key)}
            />
          ))}
        </div>
      </div>

      <InsightCardList
        household={household}
        dailyCost={dailyCosts[household]}
        flexEarnings={flexEarnings}
      />
    </div>
  );
};
