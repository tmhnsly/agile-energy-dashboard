import { memo } from 'react';
import { minutesToMilliseconds } from 'date-fns';
import { TbTriangleFilled, TbTriangleInvertedFilled, TbBoltFilled } from 'react-icons/tb';
import type { PriceStats, TimeRange } from '@/types/energy';
import { formatPricePerKwh, formatStatTime } from '@/utils/format';
import { StatsBar } from '@/components/UI';

const HALF_HOUR_MS = minutesToMilliseconds(30);

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
    <StatsBar
      ariaLabel="Price statistics"
      cards={[
        {
          key: 'low',
          label: 'Low',
          value: stats.min ? formatPricePerKwh(stats.min.price) : '—',
          subValue: stats.min ? fmtTime(stats.min.ts) : '\u00A0',
          icon: <TbTriangleInvertedFilled aria-hidden="true" />,
          tone: 'positive',
        },
        {
          key: 'peak',
          label: 'Peak',
          value: stats.max ? formatPricePerKwh(stats.max.price) : '—',
          subValue: stats.max ? fmtTime(stats.max.ts) : '\u00A0',
          icon: <TbTriangleFilled aria-hidden="true" />,
          tone: 'negative',
        },
        {
          key: 'total',
          label: 'Total',
          value: stats.total != null ? formatTotal(stats.total) : '—',
          subValue: stats.count > 0 ? formatKwh(range) : '\u00A0',
          icon: <TbBoltFilled aria-hidden="true" />,
          tone: 'neutral',
        },
      ]}
    />
  );
});
