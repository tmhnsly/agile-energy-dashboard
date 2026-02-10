import { memo } from 'react';
import { TbActivityHeartbeat, TbBoltFilled } from 'react-icons/tb';
import type { UsageStats, TimeRange } from '@/types/energy';
import { formatKwhValue, formatCostPence, formatPricePerKwh } from '@/utils/format';
import { StatsBar } from '@/components/UI';

export interface UsageStatsBarProps {
  stats: UsageStats;
  range: TimeRange;
}

export const UsageStatsBar = memo(function UsageStatsBar({
  stats,
  range,
}: UsageStatsBarProps) {
  const avgRate =
    stats.count > 0 && stats.totalKwh > 0
      ? stats.estimatedCostPence / stats.totalKwh
      : null;

  return (
    <StatsBar
      ariaLabel="Usage statistics"
      cards={[
        {
          key: 'avgRate',
          label: 'Avg. Rate',
          value: avgRate != null ? formatPricePerKwh(avgRate) : '—',
          subValue: stats.count > 0 ? `${stats.count} periods` : '\u00A0',
          icon: <TbActivityHeartbeat aria-hidden="true" />,
          tone: 'neutral',
        },
        {
          key: 'total',
          label: 'Total',
          value: stats.count > 0 ? `Est. ${formatCostPence(stats.estimatedCostPence)}` : '—',
          subValue: stats.count > 0 ? formatKwhValue(stats.totalKwh) : '\u00A0',
          icon: <TbBoltFilled aria-hidden="true" />,
          tone: 'secondary',
        },
      ]}
    />
  );
});
