'use client';

import { useCallback, useState } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { BentoTile } from '@/components/Layout';
import { BentoGrid } from '@/components/Layout';
import {
  MarketPricePanel,
  MarketPriceSkeleton,
} from '@/components/Features/MarketPrice';
import {
  HouseholdUsagePanel,
  HouseholdUsageSkeleton,
} from '@/components/Features/HouseholdUsage';

import styles from './DashboardShell.module.scss';

/**
 * Client component that calls `useMarketData()` once and fans data out
 * to both the market-price and household-usage tiles. Single fetch, no
 * duplication.
 */
export const DashboardShell = () => {
  const [retryKey, setRetryKey] = useState(0);
  const marketData = useMarketData(retryKey);
  const isLoading = marketData.status === 'loading';

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const errorMessage =
    marketData.status === 'error' ? marketData.error : null;

  return (
    <BentoGrid>
      <BentoTile
        span="wide"
        loading={isLoading}
        skeleton={<MarketPriceSkeleton />}
      >
        {marketData.status === 'error' ? (
          <div className={styles.error}>
            <p>Failed to load market data.</p>
            {errorMessage && (
              <p className={styles.errorDetail}>{errorMessage}</p>
            )}
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : marketData.status === 'ready' ? (
          <MarketPricePanel
            prices={marketData.prices}
            flexEvents={marketData.flexEvents}
          />
        ) : null}
      </BentoTile>

      <BentoTile
        span="feature"
        loading={isLoading}
        skeleton={<HouseholdUsageSkeleton />}
      >
        {marketData.status === 'error' ? (
          <div className={styles.error}>
            <p>Failed to load usage data.</p>
            {errorMessage && (
              <p className={styles.errorDetail}>{errorMessage}</p>
            )}
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry
            </button>
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
