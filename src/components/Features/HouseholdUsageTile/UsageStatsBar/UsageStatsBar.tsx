import { memo } from 'react';
import { TbTriangleFilled, TbBoltFilled } from 'react-icons/tb';
import type { UsageStats, TimeRange } from '@/types/energy';
import { formatKwhValue, formatCostPence, formatStatTime } from '@/utils/format';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import styles from './UsageStatsBar.module.scss';

export interface UsageStatsBarProps {
  stats: UsageStats;
  range: TimeRange;
}

export const UsageStatsBar = memo(function UsageStatsBar({
  stats,
  range,
}: UsageStatsBarProps) {
  const fmtTime = (ts: number) => formatStatTime(ts, range.fromTs, range.toTs);

  return (
    <div className={styles.statsRow} role="region" aria-label="Usage statistics">
      <StatCard
        className={styles.stat}
        label="Peak"
        value={stats.peak ? formatKwhValue(stats.peak.kwh) : '—'}
        subValue={stats.peak ? fmtTime(stats.peak.ts) : '\u00A0'}
        icon={<TbTriangleFilled aria-hidden="true" />}
        tone="negative"
      />
      <StatCard
        className={styles.stat}
        label="Total"
        value={stats.count > 0 ? formatKwhValue(stats.totalKwh) : '—'}
        subValue={stats.count > 0 ? `Est. ${formatCostPence(stats.estimatedCostPence)}` : '\u00A0'}
        icon={<TbBoltFilled aria-hidden="true" />}
        tone="neutral"
      />
    </div>
  );
});
