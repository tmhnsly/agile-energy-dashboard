import { TbTriangleFilled, TbBoltFilled } from 'react-icons/tb';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import { Skeleton } from '@/components/UI/Skeleton/Skeleton';
import tileStyles from './HouseholdUsageTile.module.scss';
import statsStyles from './UsageStatsBar/UsageStatsBar.module.scss';
import skelStyles from './HouseholdUsageTileSkeleton.module.scss';

/**
 * Skeleton that mirrors the exact layout of the HouseholdUsageTile content.
 * Uses the real StatCard (default neutral tone) with invisible placeholder
 * text that reserves the correct dimensions.
 */
export const HouseholdUsageTileSkeleton = () => (
  <div className={tileStyles.content}>
    <div className={tileStyles.headerTop}>
      <div className={tileStyles.headerGroup}>
        <Skeleton width="12rem" height="1.25rem" radius="small" />
        <Skeleton width="14rem" height="0.875rem" radius="small" />
      </div>
      <div className={statsStyles.statsRow}>
        <StatCard
          label="Peak"
          value="0.00 kWh"
          subValue="Mon 00:00"
          icon={<TbTriangleFilled />}
          className={skelStyles.statSkel}
        />
        <StatCard
          label="Total"
          value="0.00 kWh"
          subValue="00.0p"
          icon={<TbBoltFilled />}
          className={skelStyles.statSkel}
        />
      </div>
    </div>

    <div className={tileStyles.chartArea}>
      <Skeleton width="100%" height="100%" radius="medium" />
    </div>

    <div className={tileStyles.chartFooter}>
      <div className={skelStyles.selector}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} width="5rem" height="1.75rem" radius="small" />
        ))}
      </div>
      <Skeleton width="4rem" height="1.75rem" radius="small" />
    </div>
  </div>
);
