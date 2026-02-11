'use client';

import { useMemo } from 'react';
import type { PricePoint, HouseholdUsageRow, FlexEvent, HouseholdKey } from '@/types/energy';
import { ALL_HOUSEHOLD_KEYS } from '@/types/energy';
import { Button } from '@/components/UI/Button/Button';
import { HOUSEHOLD_THEMES } from '@/config/households';
import { formatDateTime } from '@/utils/format';
import { computeFlexEarnings, computeDailyCost } from './computeFlexInsights';
import { InsightCardList } from './InsightCardList/InsightCardList';
import styles from './FlexInsightsPanel.module.scss';

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
            Earn by adjusting your usage during grid flexibility events.
          </p>
        </div>
        <div className={styles.controlGroup}>
          {rangeSummary && (
            <span className={styles.rangeSummary}>{rangeSummary}</span>
          )}
          <div className={styles.selector} role="group" aria-label="Household type">
            {ALL_HOUSEHOLD_KEYS.map((key) => (
              <Button
                key={key}
                label={HOUSEHOLD_THEMES[key].label}
                size="small"
                color={HOUSEHOLD_THEMES[key].tone}
                variant={key === household ? 'soft' : 'ghost'}
                pressed={key === household}
                onClick={() => onHouseholdChange(key)}
              />
            ))}
          </div>
        </div>
      </div>

      <InsightCardList
        household={household}
        dailyCost={dailyCosts[household]}
        dailyCostTone={HOUSEHOLD_THEMES[household].tone}
        flexEarnings={flexEarnings}
      />
    </div>
  );
};
