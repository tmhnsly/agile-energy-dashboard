"use client";

import { useCallback, useState } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { BentoTile } from "@/components/Layout";
import { BentoGrid } from "@/components/Layout";
import type { HouseholdKey } from "@/types/energy";
import {
  MarketPricePanel,
  MarketPriceSkeleton,
} from "@/components/Features/MarketPrice";
import {
  HouseholdUsagePanel,
  HouseholdUsageSkeleton,
} from "@/components/Features/HouseholdUsage";
import {
  FlexInsightsPanel,
  FlexInsightsSkeleton,
  ShiftSimulator,
  ShiftSimulatorSkeleton,
} from "@/components/Features/FlexInsights";

import styles from "./DashboardShell.module.scss";

/**
 * Client component that calls `useMarketData()` once and fans data out
 * to the market-price, household-usage, flex-insights, and shift-simulator
 * tiles. Single fetch, no duplication.
 */
export const DashboardShell = () => {
  const [retryKey, setRetryKey] = useState(0);
  const marketData = useMarketData(retryKey);
  const isLoading = marketData.status === "loading";

  const [household, setHousehold] = useState<HouseholdKey>("standard");

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const handleHouseholdChange = useCallback((key: HouseholdKey) => {
    setHousehold(key);
  }, []);

  const errorMessage = marketData.status === "error" ? marketData.error : null;

  return (
    <BentoGrid>
      <BentoTile
        span="wide"
        loading={isLoading}
        skeleton={<MarketPriceSkeleton />}
      >
        {marketData.status === "error" ? (
          <div className={styles.error}>
            <p>Failed to load market data.</p>
            {errorMessage && (
              <p className={styles.errorDetail}>{errorMessage}</p>
            )}
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : marketData.status === "ready" ? (
          <MarketPricePanel
            prices={marketData.prices}
            flexEvents={marketData.flexEvents}
          />
        ) : null}
      </BentoTile>

      <BentoTile
        span="standard"
        loading={isLoading}
        skeleton={<HouseholdUsageSkeleton />}
      >
        {marketData.status === "error" ? (
          <div className={styles.error}>
            <p>Failed to load usage data.</p>
            {errorMessage && (
              <p className={styles.errorDetail}>{errorMessage}</p>
            )}
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : marketData.status === "ready" ? (
          <HouseholdUsagePanel
            usage={marketData.householdUsage}
            prices={marketData.prices}
          />
        ) : null}
      </BentoTile>

      <BentoTile
        span="standard"
        loading={isLoading}
        skeleton={<ShiftSimulatorSkeleton />}
      >
        {marketData.status === "error" ? (
          <div className={styles.error}>
            <p>Failed to load simulator.</p>
            {errorMessage && (
              <p className={styles.errorDetail}>{errorMessage}</p>
            )}
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : marketData.status === "ready" ? (
          <ShiftSimulator
            usage={marketData.householdUsage}
            prices={marketData.prices}
            household={household}
          />
        ) : null}
      </BentoTile>

      <BentoTile
        span="standard"
        loading={isLoading}
        skeleton={<FlexInsightsSkeleton />}
      >
        {marketData.status === "error" ? (
          <div className={styles.error}>
            <p>Failed to load insights data.</p>
            {errorMessage && (
              <p className={styles.errorDetail}>{errorMessage}</p>
            )}
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : marketData.status === "ready" ? (
          <FlexInsightsPanel
            prices={marketData.prices}
            usage={marketData.householdUsage}
            flexEvents={marketData.flexEvents}
            household={household}
            onHouseholdChange={handleHouseholdChange}
          />
        ) : null}
      </BentoTile>
    </BentoGrid>
  );
};
