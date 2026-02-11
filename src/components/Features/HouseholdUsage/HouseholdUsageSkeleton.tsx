import { TbTriangleFilled, TbBoltFilled } from 'react-icons/tb';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import { Skeleton } from '@/components/UI/Skeleton/Skeleton';
import { cx } from '@/utils/cx';
import panelStyles from './HouseholdUsagePanel.module.scss';
import statsStyles from '@/components/UI/StatsBar/StatsBar.module.scss';
import skelStyles from './HouseholdUsageSkeleton.module.scss';

/**
 * Skeleton that mirrors the exact layout of the HouseholdUsagePanel content.
 * Heights match the real typography line boxes so spacing is identical.
 */
export const HouseholdUsageSkeleton = () => (
  <div className={panelStyles.content}>
    <div className={panelStyles.headerRow}>
      <div className={panelStyles.headerGroup}>
        <Skeleton width="12rem" height="1.4rem" radius="small" />
        <Skeleton width="14rem" height="1.25rem" radius="small" />
      </div>
      <div className={statsStyles.statsRow} data-count="2">
        <StatCard
          label="Peak"
          value="0.00 kWh"
          subValue="Mon 00:00"
          icon={<TbTriangleFilled />}
          className={cx(statsStyles.stat, skelStyles.statSkel)}
        />
        <StatCard
          label="Total"
          value="0.00 kWh"
          subValue="00.0p"
          icon={<TbBoltFilled />}
          className={cx(statsStyles.stat, skelStyles.statSkel)}
        />
      </div>
    </div>

    <div className={panelStyles.chartArea}>
      <Skeleton width="100%" height="100%" radius="medium" />
    </div>

    <div className={panelStyles.chartControls}>
      <Skeleton width="2.75rem" height="2.75rem" radius="pill" />
      <Skeleton width="5rem" height="2.75rem" radius="pill" />
      <Skeleton width="6rem" height="2.75rem" radius="pill" />
      <Skeleton width="10rem" height="2.75rem" radius="pill" />
    </div>

    <Skeleton width="100%" height="2.75rem" radius="pill" />
  </div>
);
