import { TbTriangleInvertedFilled, TbTriangleFilled, TbEqual } from 'react-icons/tb';
import { StatCard } from '@/components/StatCard/StatCard';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import panelStyles from './MarketPricePanel.module.scss';
import statsStyles from './PriceStatsBar/PriceStatsBar.module.scss';
import skelStyles from './MarketPricePanelSkeleton.module.scss';

/**
 * Skeleton that mirrors the exact layout of MarketPricePanel.
 * Uses the real StatCard (default neutral tone) with invisible placeholder
 * text that reserves the correct dimensions. No tone prop = no coloured borders.
 */
export const MarketPricePanelSkeleton = () => (
  <div className={panelStyles.content}>
    <div className={panelStyles.headerTop}>
      <div className={panelStyles.headerGroup}>
        <Skeleton width="10rem" height="1.25rem" radius="small" />
        <Skeleton width="14rem" height="0.875rem" radius="small" />
      </div>
      <div className={statsStyles.statsRow}>
        <StatCard
          label="Low"
          value="00.0p/kWh"
          subValue="Mon 00:00"
          icon={<TbTriangleInvertedFilled />}
          className={skelStyles.statSkel}
        />
        <StatCard
          label="High"
          value="00.0p/kWh"
          subValue="Mon 00:00"
          icon={<TbTriangleFilled />}
          className={skelStyles.statSkel}
        />
        <StatCard
          label="Total"
          value="£00.00"
          subValue="00 kWh"
          icon={<TbEqual />}
          className={skelStyles.statSkel}
        />
      </div>
    </div>

    <div className={panelStyles.chartArea}>
      <Skeleton width="100%" height="100%" radius="medium" />
    </div>

    <div className={panelStyles.chartFooter}>
      <Skeleton width="8rem" height="0.875rem" radius="small" />
      <Skeleton width="4rem" height="1.75rem" radius="small" />
    </div>

    <div className={skelStyles.presets}>
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} width="3rem" height="1.75rem" radius="small" />
      ))}
    </div>
  </div>
);
