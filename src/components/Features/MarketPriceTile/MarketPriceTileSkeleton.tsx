import { TbTriangleInvertedFilled, TbTriangleFilled, TbCalculator } from 'react-icons/tb';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import { Skeleton } from '@/components/UI/Skeleton/Skeleton';
import tileStyles from './MarketPriceTile.module.scss';
import statsStyles from './PriceStatsBar/PriceStatsBar.module.scss';
import skelStyles from './MarketPriceTileSkeleton.module.scss';

/**
 * Skeleton that mirrors the exact layout of the MarketPriceTile content.
 * Uses the real StatCard (default neutral tone) with invisible placeholder
 * text that reserves the correct dimensions. No tone prop = no coloured borders.
 */
export const MarketPriceTileSkeleton = () => (
  <div className={tileStyles.content}>
    <div className={tileStyles.headerTop}>
      <div className={tileStyles.headerGroup}>
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
          value="00.0p"
          subValue="0 kWh"
          icon={<TbCalculator />}
          className={skelStyles.statSkel}
        />
      </div>
    </div>

    <div className={tileStyles.chartArea}>
      <Skeleton width="100%" height="100%" radius="medium" />
    </div>

    <div className={tileStyles.chartFooter}>
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
