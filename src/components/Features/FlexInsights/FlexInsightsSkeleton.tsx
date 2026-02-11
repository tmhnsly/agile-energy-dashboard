import { Skeleton } from '@/components/UI/Skeleton/Skeleton';
import panelStyles from './FlexInsightsPanel.module.scss';
import cardStyles from './InsightCardList/InsightCardList.module.scss';

export const FlexInsightsSkeleton = () => (
  <div className={panelStyles.content}>
    <div className={panelStyles.headerRow}>
      <div className={panelStyles.headerGroup}>
        <Skeleton width="12rem" height="1.4rem" radius="small" />
        <Skeleton width="16rem" height="1rem" radius="small" />
      </div>
      <div className={panelStyles.controlGroup}>
        <Skeleton width="10rem" height="0.9rem" radius="small" />
        <div className={panelStyles.selector}>
          <Skeleton width="5rem" height="2.25rem" radius="pill" />
          <Skeleton width="5.5rem" height="2.25rem" radius="pill" />
          <Skeleton width="5.5rem" height="2.25rem" radius="pill" />
        </div>
      </div>
    </div>

    <div className={cardStyles.cards}>
      <Skeleton width="100%" height="4.5rem" radius="medium" />
      <Skeleton width="100%" height="4.5rem" radius="medium" />
      <Skeleton width="100%" height="4.5rem" radius="medium" />
    </div>
  </div>
);
