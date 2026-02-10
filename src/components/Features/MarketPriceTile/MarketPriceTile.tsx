"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { BentoTile } from "@/components/Layout";
import { MarketPricePanel } from "./MarketPricePanel";
import { MarketPriceTileSkeleton } from "./MarketPriceTileSkeleton";
import styles from "./MarketPriceTile.module.scss";

/**
 * Tile-level wrapper — single owner of loading / error / ready state.
 * BentoTile renders the skeleton while loading; MarketPricePanel receives
 * resolved data as props and never fetches on its own.
 */
export const MarketPriceTile = () => {
  const marketData = useMarketData();
  const isLoading = marketData.status === "loading";

  return (
    <BentoTile
      variant="wide"
      loading={isLoading}
      skeleton={<MarketPriceTileSkeleton />}
    >
      {marketData.status === "error" ? (
        <div className={styles.error}>
          Failed to load market data. Please try again later.
        </div>
      ) : marketData.status === "ready" ? (
        <MarketPricePanel
          prices={marketData.prices}
          flexEvents={marketData.flexEvents}
        />
      ) : null}
    </BentoTile>
  );
};
