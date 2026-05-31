"use client";

import { useCallback, useState } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { BentoTile } from "@/components/Layout";
import { BentoGrid } from "@/components/Layout";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import type { HouseholdKey } from "@/types/energy";
import { HOUSEHOLD_THEMES } from "@/config/households";
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

function TileError({
  message,
  detail,
  onRetry,
}: {
  message: string;
  detail: string | null;
  onRetry: () => void;
}) {
  return (
    <div className={styles.error}>
      <p>{message}</p>
      {detail && <p className={styles.errorDetail}>{detail}</p>}
      <button className={styles.retryBtn} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

/**
 * Client component that calls `useMarketData()` once and fans data out
 * to the market-price, household-usage, flex-insights, and shift-simulator
 * tiles. Single fetch, no duplication.
 */
export const DashboardShell = () => {
  const [retryKey, setRetryKey] = useState(0);
  const marketData = useMarketData(retryKey);
  const isLoading = marketData.status === "loading";
  const isOnline = useNetworkStatus();

  const [household, setHousehold] = useState<HouseholdKey>("standard");

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const handleHouseholdChange = useCallback((key: HouseholdKey) => {
    setHousehold(key);
  }, []);

  const errorDetail = marketData.status === "error" ? marketData.error : null;
  const usingSampleData =
    marketData.status === "ready" && marketData.priceSource === "snapshot";

  return (
    <>
      {!isOnline && <OfflineBanner />}
      {isOnline && usingSampleData && <SampleDataBanner />}
      <BentoGrid>
      <BentoTile
        span="wide"
        loading={isLoading}
        skeleton={<MarketPriceSkeleton />}
      >
        {marketData.status === "error" ? (
          <TileError message="Failed to load market data." detail={errorDetail} onRetry={handleRetry} />
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
          <TileError message="Failed to load usage data." detail={errorDetail} onRetry={handleRetry} />
        ) : marketData.status === "ready" ? (
          <HouseholdUsagePanel
            usage={marketData.householdUsage}
            prices={marketData.prices}
          />
        ) : null}
      </BentoTile>

      <BentoTile
        span="standard"
        className={styles.simulatorTile}
        tone={isLoading ? undefined : HOUSEHOLD_THEMES[household].tone}
        loading={isLoading}
        skeleton={<ShiftSimulatorSkeleton />}
      >
        {marketData.status === "error" ? (
          <TileError message="Failed to load simulator." detail={errorDetail} onRetry={handleRetry} />
        ) : marketData.status === "ready" ? (
          <ShiftSimulator
            usage={marketData.householdUsage}
            prices={marketData.prices}
            household={household}
          />
        ) : null}
      </BentoTile>

      <BentoTile
        span="compact"
        className={styles.insightsTile}
        loading={isLoading}
        skeleton={<FlexInsightsSkeleton />}
      >
        {marketData.status === "error" ? (
          <TileError message="Failed to load insights data." detail={errorDetail} onRetry={handleRetry} />
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
    </>
  );
};
