import { memo } from 'react';
import { TbTriangleFilled, TbBoltFilled } from 'react-icons/tb';
import type { UsageStats, TimeRange } from '@/types/energy';
import { formatKwhValue, formatCostPence, formatStatTime } from '@/utils/format';
import { StatsBar } from '@/components/UI';

export interface UsageStatsBarProps {
  stats: UsageStats;
  range: TimeRange;
}

export const UsageStatsBar = memo(function UsageStatsBar({
  stats,
  range,
}: UsageStatsBarProps) {
  const fmtTime = (ts: number) => formatStatTime(ts);

  return (
    <StatsBar
      ariaLabel="Usage statistics"
      cards={[
        {
          key: 'peak',
          label: 'Peak',
          value: stats.peak ? formatKwhValue(stats.peak.kwh) : '—',
          subValue: stats.peak ? fmtTime(stats.peak.ts) : '\u00A0',
          icon: <TbTriangleFilled aria-hidden="true" />,
          tone: 'negative',
        },
        {
          key: 'total',
          label: 'Total',
          value: stats.count > 0 ? formatKwhValue(stats.totalKwh) : '—',
          subValue: stats.count > 0 ? `Est. ${formatCostPence(stats.estimatedCostPence)}` : '\u00A0',
          icon: <TbBoltFilled aria-hidden="true" />,
          tone: 'neutral',
        },
      ]}
    />
  );
});
