'use client';

import { memo, useMemo, type ReactNode } from 'react';
import {
  TbTriangleInvertedFilled,
  TbTriangleFilled,
  TbBoltFilled,
} from 'react-icons/tb';
import type { FlexEarningResult, FlexCategory, HouseholdKey } from '@/types/energy';
import type { StatCardTone } from '@/components/UI/StatCard/StatCard';
import { HOUSEHOLD_THEMES } from '@/config/households';
import { formatCostPence, formatTime } from '@/utils/format';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import styles from './InsightCardList.module.scss';

function eventAppearance(category: FlexCategory): { icon: ReactNode; verb: string; tone: StatCardTone } {
  switch (category) {
    case 'use-less':
      return { icon: <TbTriangleInvertedFilled />, verb: 'Use less', tone: 'positive' };
    case 'use-more':
      return { icon: <TbTriangleFilled />, verb: 'Use more', tone: 'positive' };
    default:
      return { icon: <TbBoltFilled />, verb: 'Flex opportunity', tone: 'positive' };
  }
}

/** Display order: use-more first, then use-less, then other. */
const CATEGORY_ORDER: Record<FlexCategory, number> = { 'use-more': 0, 'use-less': 1, other: 2 };

interface InsightCardListProps {
  household: HouseholdKey;
  dailyCost: number;
  flexEarnings: FlexEarningResult[];
}

/**
 * Renders the daily-cost card followed by sorted flex-earning cards.
 * Events are classified by label (use-more, use-less, other) and sorted
 * so actionable events appear first.
 */
export const InsightCardList = memo(function InsightCardList({
  household,
  dailyCost,
  flexEarnings,
}: InsightCardListProps) {
  const { label: householdLabel, tone: householdTone } = HOUSEHOLD_THEMES[household];

  const sorted = useMemo(() => {
    return [...flexEarnings].sort(
      (a, b) => CATEGORY_ORDER[a.event.category] - CATEGORY_ORDER[b.event.category],
    );
  }, [flexEarnings]);

  const count = 1 + sorted.length;

  return (
    <div className={styles.cards} data-count={Math.min(count, 4)}>
      <StatCard
        label={`${householdLabel} daily cost`}
        value={formatCostPence(dailyCost)}
        icon={<TbBoltFilled />}
        tone={householdTone}
      />

      {sorted.map((earning) => {
        const { icon, verb, tone } = eventAppearance(earning.event.category);
        return (
          <StatCard
            key={earning.event.id}
            label={`${verb} · ${formatTime(earning.event.startTs)}–${formatTime(earning.event.endTs)}`}
            value={formatCostPence(earning.earningsPence)}
            subValue={`${earning.shiftableKwh.toFixed(1)} kWh shiftable`}
            icon={icon}
            tone={tone}
          />
        );
      })}
    </div>
  );
});
