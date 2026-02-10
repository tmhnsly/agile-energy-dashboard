import { TbTriangleInvertedFilled, TbTriangleFilled, TbBoltFilled } from 'react-icons/tb';
import { StatCard } from '@/components/UI/StatCard/StatCard';
import { Skeleton } from '@/components/UI/Skeleton/Skeleton';
import panelStyles from './MarketPricePanel.module.scss';
import statsStyles from '@/components/UI/StatsBar/StatsBar.module.scss';
import skelStyles from './MarketPriceSkeleton.module.scss';

/**
 * Skeleton that mirrors the exact layout of the MarketPricePanel content.
 * Heights match the real typography line boxes so spacing is identical.
 */
export const MarketPriceSkeleton = () => (
  <div className={panelStyles.content}>
    <div className={panelStyles.headerTop}>
      <div className={panelStyles.headerGroup}>
        <Skeleton width="10rem" height="1.4rem" radius="small" />
        <Skeleton width="14rem" height="1.25rem" radius="small" />
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
          icon={<TbBoltFilled />}
          className={skelStyles.statSkel}
        />
      </div>
    </div>

    <div className={panelStyles.chartArea}>
      <Skeleton width="100%" height="100%" radius="medium" />
    </div>

    <div className={panelStyles.chartLegend}>
      <Skeleton width="8rem" height="1.5rem" radius="small" />
      <Skeleton width="5.5rem" height="1.5rem" radius="small" />
    </div>

    <div className={panelStyles.chartControls}>
      <div className={skelStyles.presets}>
        <Skeleton width="2.75rem" height="2.75rem" radius="full" />
        <Skeleton width="2.5rem" height="2.75rem" radius="full" />
        <Skeleton width="3rem" height="2.75rem" radius="full" />
        <Skeleton width="3rem" height="2.75rem" radius="full" />
      </div>
      <Skeleton width="7rem" height="2.75rem" radius="full" />
    </div>
  </div>
);
