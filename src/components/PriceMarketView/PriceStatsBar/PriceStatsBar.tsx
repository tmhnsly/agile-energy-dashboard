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
      {stats.min && (
        <StatCard
          label="Low"
          value={formatPricePerKwh(stats.min.price)}
          subValue={formatTime(stats.min.ts)}
          icon={<TbTriangleInvertedFilled />}
          tone="positive"
        />
      )}
      {stats.max && (
        <StatCard
          label="High"
          value={formatPricePerKwh(stats.max.price)}
          subValue={formatTime(stats.max.ts)}
          icon={<TbTriangleFilled />}
          tone="negative"
        />
      )}
    </div>
  );
});
