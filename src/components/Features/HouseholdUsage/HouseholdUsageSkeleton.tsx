import { Skeleton } from '@/components/UI/Skeleton/Skeleton';
import panelStyles from './HouseholdUsagePanel.module.scss';
import statsStyles from '@/components/UI/StatsBar/StatsBar.module.scss';
import statCardStyles from '@/components/UI/StatCard/StatCard.module.scss';

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
        {[0, 1].map((i) => (
          <div key={i} className={statsStyles.stat}>
            <div className={statCardStyles.card}>
              <div className={statCardStyles.header}>
                <Skeleton width="0.75rem" height="0.75rem" radius="small" />
                <Skeleton width="3rem" height="0.75rem" radius="small" />
              </div>
              <Skeleton className={statCardStyles.skeletonValue} radius="small" />
              <Skeleton className={statCardStyles.skeletonSubValue} radius="small" />
            </div>
          </div>
        ))}
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
