'use client';

import { useMarketData } from '@/hooks/useMarketData';
import { BentoTile } from '@/components/Layout';
import { BentoGrid } from '@/components/Layout';
import { MarketPricePanel, MarketPriceTileSkeleton } from '@/components/Features/MarketPriceTile';
import {
  HouseholdUsagePanel,
  HouseholdUsageTileSkeleton,
} from '@/components/Features/HouseholdUsageTile';

import styles from './DashboardShell.module.scss';

/**
 * Client component that calls `useMarketData()` once and fans data out
 * to both the market-price and household-usage tiles. Single fetch, no
 * duplication.
 */
export const DashboardShell = () => {
  const marketData = useMarketData();
  const isLoading = marketData.status === 'loading';

  return (
    <BentoGrid>
      <BentoTile
        variant="wide"
        loading={isLoading}
        skeleton={<MarketPriceTileSkeleton />}
      >
        {marketData.status === 'error' ? (
          <div className={styles.error}>
            Failed to load market data. Please try again later.
          </div>
        ) : marketData.status === 'ready' ? (
          <MarketPricePanel
            prices={marketData.prices}
            flexEvents={marketData.flexEvents}
          />
        ) : null}
      </BentoTile>

      <BentoTile
        variant="feature"
        loading={isLoading}
        skeleton={<HouseholdUsageTileSkeleton />}
      >
        {marketData.status === 'error' ? (
          <div className={styles.error}>
            Failed to load usage data. Please try again later.
          </div>
        ) : marketData.status === 'ready' ? (
          <HouseholdUsagePanel
            usage={marketData.householdUsage}
            prices={marketData.prices}
          />
        ) : null}
      </BentoTile>

      <BentoTile>
        <h3 className={styles.tileTitle}>Notifications</h3>
        <p className={styles.tileText}>
          Price alerts and flex event notifications.
        </p>
      </BentoTile>
    </BentoGrid>
  );
};
