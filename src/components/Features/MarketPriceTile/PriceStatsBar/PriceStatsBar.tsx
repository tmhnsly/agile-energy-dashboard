import { memo } from 'react';
import { TbTriangleFilled, TbTriangleInvertedFilled, TbCalculator } from 'react-icons/tb';
import type { PriceStats, TimeRange } from '@/types/energy';
import { formatPricePerKwh, formatStatTime } from '@/utils/format';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import styles from './PriceStatsBar.module.scss';

const HALF_HOUR_MS = 30 * 60_000;

function formatTotal(pence: number): string {
  if (pence >= 100) return `£${(pence / 100).toFixed(2)}`;
  return `${pence.toFixed(1)}p`;
}

function formatKwh(range: TimeRange): string {
  const kWh = (range.toTs - range.fromTs) / HALF_HOUR_MS;
  return `${Number.isInteger(kWh) ? kWh : kWh.toFixed(1)} kWh`;
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
    <div className={styles.statsRow} role="region" aria-label="Price statistics">
      <StatCard
        className={styles.stat}
        label="Low"
        value={stats.min ? formatPricePerKwh(stats.min.price) : '—'}
        subValue={stats.min ? fmtTime(stats.min.ts) : '\u00A0'}
        icon={<TbTriangleInvertedFilled aria-hidden="true" />}
        tone="positive"
      />
      <StatCard
        className={styles.stat}
        label="High"
        value={stats.max ? formatPricePerKwh(stats.max.price) : '—'}
        subValue={stats.max ? fmtTime(stats.max.ts) : '\u00A0'}
        icon={<TbTriangleFilled aria-hidden="true" />}
        tone="negative"
      />
      <StatCard
        className={styles.stat}
        label="Total"
        value={stats.total != null ? formatTotal(stats.total) : '—'}
        subValue={stats.count > 0 ? formatKwh(range) : '\u00A0'}
        icon={<TbCalculator aria-hidden="true" />}
        tone="accent"
      />
    </div>
  );
});
