import { memo } from 'react';
import { TbTriangleFilled, TbTriangleInvertedFilled, TbBoltFilled } from 'react-icons/tb';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { PriceStats, TimeRange } from '@/types/energy';
import { formatPricePerKwh, formatCostPence, formatStatTime, formatKwhValue } from '@/utils/format';
import { StatsBar } from '@/components/UI';

export interface PriceStatsBarProps {
  stats: PriceStats;
  range: TimeRange;
}

export const PriceStatsBar = memo(function PriceStatsBar({
  stats,
  range,
}: PriceStatsBarProps) {
  const fmtTime = (ts: number) => formatStatTime(ts);

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
          value: stats.total != null ? formatCostPence(stats.total) : '—',
          subValue: stats.count > 0
            ? formatKwhValue((range.toTs - range.fromTs) / HALF_HOUR_MS)
            : '\u00A0',
          icon: <TbBoltFilled aria-hidden="true" />,
          tone: 'neutral',
        },
      ]}
    />
  );
});
