'use client';

import { memo, type ReactNode } from 'react';
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

const HOUSEHOLD_LABELS: Record<HouseholdKey, string> = {
  standard: 'Standard',
  heatPump: 'Heat Pump',
  heatPumpBattery: 'Heat Pump + Battery',
};

/** Map a flex event label to an appropriate icon and verb. All are positive opportunities. */
function eventAppearance(label?: string): { icon: ReactNode; verb: string } {
  const lower = label?.toLowerCase() ?? '';

  if (lower.includes('turn down') || lower.includes('reduce')) {
    return { icon: <TbTriangleInvertedFilled />, verb: 'Use less' };
  }

  if (lower.includes('turn up') || lower.includes('increase')) {
    return { icon: <TbTriangleFilled />, verb: 'Use more' };
  }

  return { icon: <TbBoltFilled />, verb: 'Flex opportunity' };
}

interface InsightCardListProps {
  household: HouseholdKey;
  dailyCost: number;
  flexEarnings: FlexEarningResult[];
}

export const InsightCardList = memo(function InsightCardList({
  household,
  dailyCost,
  flexEarnings,
}: InsightCardListProps) {
  const count = 1 + flexEarnings.length;

  return (
    <div className={styles.cards} data-count={Math.min(count, 4)}>
      <StatCard
        label={`${HOUSEHOLD_LABELS[household]} daily cost`}
        value={formatCostPence(dailyCost)}
        icon={<TbBoltFilled />}
        tone="secondary"
      />

      {flexEarnings.map((earning) => {
        const { icon, verb } = eventAppearance(earning.event.label);
        return (
          <StatCard
            key={earning.event.id}
            label={`${verb} · ${formatTime(earning.event.startTs)}–${formatTime(earning.event.endTs)}`}
            value={formatCostPence(earning.earningsPence)}
            subValue={`${earning.shiftableKwh.toFixed(1)} kWh shiftable`}
            icon={icon}
            tone="positive"
          />
        );
      })}
    </div>
  );
});
