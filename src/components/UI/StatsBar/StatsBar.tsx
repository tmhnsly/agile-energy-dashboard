import { memo, type ReactNode } from 'react';
import type { StatCardTone } from '@/components/UI/StatCard/StatCard';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import styles from './StatsBar.module.scss';

export interface StatsBarCard {
  key: string;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  icon?: ReactNode;
  tone?: StatCardTone;
}

export interface StatsBarProps {
  cards: StatsBarCard[];
  ariaLabel: string;
  className?: string;
}

export const StatsBar = memo(function StatsBar({
  cards,
  ariaLabel,
  className,
}: StatsBarProps) {
  return (
    <div className={className ?? styles.statsRow} role="region" aria-label={ariaLabel}>
      {cards.map(({ key, ...cardProps }) => (
        <StatCard key={key} className={styles.stat} {...cardProps} />
      ))}
    </div>
  );
});
