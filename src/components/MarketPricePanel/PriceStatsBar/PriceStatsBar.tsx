import { memo } from 'react';
import { TbTriangleFilled, TbTriangleInvertedFilled } from 'react-icons/tb';
import type { PriceStats } from '@/types/energy';
import { formatPricePerKwh, formatTime } from '@/utils/format';
import { StatCard } from '@/components/StatCard/StatCard';
import styles from './PriceStatsBar.module.scss';

export interface PriceStatsBarProps {
  stats: PriceStats;
}

export const PriceStatsBar = memo(function PriceStatsBar({ stats }: PriceStatsBarProps) {
  return (
    <div className={styles.statsRow}>
      <StatCard
        label="Low"
        value={stats.min ? formatPricePerKwh(stats.min.price) : '—'}
        subValue={stats.min ? formatTime(stats.min.ts) : '\u00A0'}
        icon={<TbTriangleInvertedFilled />}
        tone="positive"
      />
      <StatCard
        label="High"
        value={stats.max ? formatPricePerKwh(stats.max.price) : '—'}
        subValue={stats.max ? formatTime(stats.max.ts) : '\u00A0'}
        icon={<TbTriangleFilled />}
        tone="negative"
      />
    </div>
  );
});
