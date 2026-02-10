import { memo } from 'react';
import { TbTriangleFilled, TbTriangleInvertedFilled, TbCalculator } from 'react-icons/tb';
import type { PriceStats, TimeRange } from '@/types/energy';
import { formatPricePerKwh, formatStatTime } from '@/utils/format';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import styles from './PriceStatsBar.module.scss';

function formatTotal(pence: number): string {
  if (pence >= 100) return `£${(pence / 100).toFixed(2)}`;
  return `${pence.toFixed(1)}p`;
}

export interface PriceStatsBarProps {
  stats: PriceStats;
  range: TimeRange;
}

export const PriceStatsBar = memo(function PriceStatsBar({
  stats,
  range,
}: PriceStatsBarProps) {
  const fmtTime = (ts: number) => formatStatTime(ts, range.fromTs, range.toTs);

  return (
    <div className={styles.statsRow}>
      <StatCard
        label="Low"
        value={stats.min ? formatPricePerKwh(stats.min.price) : '—'}
        subValue={stats.min ? fmtTime(stats.min.ts) : '\u00A0'}
        icon={<TbTriangleInvertedFilled />}
        tone="positive"
      />
      <StatCard
        label="High"
        value={stats.max ? formatPricePerKwh(stats.max.price) : '—'}
        subValue={stats.max ? fmtTime(stats.max.ts) : '\u00A0'}
        icon={<TbTriangleFilled />}
        tone="negative"
      />
      <StatCard
        label="Total"
        value={stats.total != null ? formatTotal(stats.total) : '—'}
        subValue={stats.count > 0 ? `${stats.count} kWh` : '\u00A0'}
        icon={<TbCalculator />}
        tone="accent"
      />
    </div>
  );
});
