import { Skeleton } from '@/components/Skeleton/Skeleton';
import styles from './MarketPricePanelSkeleton.module.scss';

export const MarketPricePanelSkeleton = () => (
  <div className={styles.layout}>
    {/* Header region: title + range + stats */}
    <div className={styles.header}>
      <div className={styles.headerText}>
        <Skeleton width="10rem" height="1.25rem" radius="small" />
        <Skeleton width="14rem" height="0.875rem" radius="small" />
      </div>
      <div className={styles.stats}>
        <Skeleton width="6rem" height="3.5rem" radius="small" />
        <Skeleton width="6rem" height="3.5rem" radius="small" />
        <Skeleton width="6rem" height="3.5rem" radius="small" />
      </div>
    </div>

    {/* Chart region */}
    <Skeleton width="100%" height="100%" radius="small" className={styles.chart} />

    {/* Footer region: legend + button */}
    <div className={styles.footer}>
      <Skeleton width="8rem" height="0.875rem" radius="small" />
      <Skeleton width="4rem" height="1.75rem" radius="small" />
    </div>

    {/* Quick range bar */}
    <div className={styles.presets}>
      <Skeleton width="3rem" height="1.75rem" radius="small" />
      <Skeleton width="3rem" height="1.75rem" radius="small" />
      <Skeleton width="3rem" height="1.75rem" radius="small" />
      <Skeleton width="3rem" height="1.75rem" radius="small" />
      <Skeleton width="3rem" height="1.75rem" radius="small" />
    </div>
  </div>
);
