'use client';

import { memo, useMemo, type ReactNode } from 'react';
import {
  TbTriangleInvertedFilled,
  TbTriangleFilled,
  TbBoltFilled,
} from 'react-icons/tb';
import type { HouseholdKey, FlexEarningResult } from '@/types/energy';
import type { StatCardTone } from '@/components/UI/StatCard/StatCard';
import { formatCostPence, formatTime } from '@/utils/format';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import styles from './InsightCardList.module.scss';

type EventType = 'use-more' | 'use-less' | 'other';

function classifyEvent(label?: string): EventType {
  const lower = label?.toLowerCase() ?? '';
  if (lower.includes('turn down') || lower.includes('reduce')) return 'use-less';
  if (lower.includes('turn up') || lower.includes('increase')) return 'use-more';
  return 'other';
}

function eventAppearance(type: EventType): { icon: ReactNode; verb: string; tone: StatCardTone } {
  switch (type) {
    case 'use-less':
      return { icon: <TbTriangleInvertedFilled />, verb: 'Use less', tone: 'positive' };
    case 'use-more':
      return { icon: <TbTriangleFilled />, verb: 'Use more', tone: 'positive' };
    default:
      return { icon: <TbBoltFilled />, verb: 'Flex opportunity', tone: 'positive' };
  }
}

/** Sort order: use-more first, then use-less, then other. */
const TYPE_ORDER: Record<EventType, number> = { 'use-more': 0, 'use-less': 1, other: 2 };

interface InsightCardListProps {
  household: HouseholdKey;
  dailyCost: number;
  dailyCostTone: StatCardTone;
  flexEarnings: FlexEarningResult[];
}

export const InsightCardList = memo(function InsightCardList({
  household,
  dailyCost,
  dailyCostTone,
  flexEarnings,
}: InsightCardListProps) {
  const sorted = useMemo(() => {
    return [...flexEarnings].sort((a, b) => {
      const ta = TYPE_ORDER[classifyEvent(a.event.label)];
      const tb = TYPE_ORDER[classifyEvent(b.event.label)];
      return ta - tb;
    });
  }, [flexEarnings]);

  const count = 1 + sorted.length;

  return (
    <div className={styles.cards} data-count={Math.min(count, 4)}>
      <StatCard
        label="Daily cost"
        value={formatCostPence(dailyCost)}
        icon={<TbBoltFilled />}
        tone={dailyCostTone}
      />

      {sorted.map((earning) => {
        const type = classifyEvent(earning.event.label);
        const { icon, verb, tone } = eventAppearance(type);
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
