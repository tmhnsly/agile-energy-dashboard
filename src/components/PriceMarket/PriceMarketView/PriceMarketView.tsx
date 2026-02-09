'use client';

import { useState } from 'react';
import { ParentSize } from '@visx/responsive';
import type { PricePoint, FlexEvent, TimeRange } from '@/types/energy';
import { useMarketData } from '@/hooks/useMarketData';
import { usePriceRange } from '@/hooks/usePriceRange';
import { usePriceStats } from '@/hooks/usePriceStats';
import { formatDateTime } from '@/utils/format';
import { TimeSeriesChart } from '../TimeSeriesChart/TimeSeriesChart';
import { PriceStatsBar } from '../PriceStatsBar/PriceStatsBar';
import { Legend } from '../Legend/Legend';
import styles from './PriceMarketView.module.scss';

export interface PriceMarketViewProps {
  /** Supply data directly (e.g. in Storybook). When provided, skips fetching. */
  prices?: PricePoint[];
  flexEvents?: FlexEvent[];
}

function chartHeight(containerWidth: number): number {
  if (containerWidth < 480) return 240;
  if (containerWidth < 768) return 300;
  return 380;
}

export const PriceMarketView = ({
  prices: propPrices,
  flexEvents: propFlexEvents,
}: PriceMarketViewProps) => {
  const marketData = useMarketData();

  const prices =
    propPrices ?? (marketData.status === 'ready' ? marketData.prices : []);
  const flexEvents =
    propFlexEvents ??
    (marketData.status === 'ready' ? marketData.flexEvents : []);

  const isLoading = !propPrices && marketData.status === 'loading';
  const isError = !propPrices && marketData.status === 'error';

  const { fullRange, activeRange, isCustomRange, setRange, resetRange } =
    usePriceRange(prices);
  const [previewRange, setPreviewRange] = useState<TimeRange | null>(null);
  const displayRange = previewRange ?? activeRange;
  const stats = usePriceStats(prices, displayRange);

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading market data...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.error}>
          Failed to load market data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.cardHeader}>
        <h2 className={styles.title}>Price &amp; Market View</h2>
        <div className={styles.rangeSummary}>
          {formatDateTime(displayRange.fromTs)} &ndash;{' '}
          {formatDateTime(displayRange.toTs)}
        </div>
        <PriceStatsBar stats={stats} />
      </div>
      <div className={styles.chartArea}>
        <ParentSize>
          {({ width }) => (
            <TimeSeriesChart
              points={prices}
              flexEvents={flexEvents}
              fullRange={fullRange}
              activeRange={activeRange}
              onRangeChange={setRange}
              onRangePreview={setPreviewRange}
              width={width}
              height={chartHeight(width)}
            />
          )}
        </ParentSize>
      </div>
      <div className={styles.chartFooter}>
        <Legend />
        <button
          type="button"
          className={styles.resetButton}
          disabled={!isCustomRange}
          onClick={resetRange}
        >
          Reset range
        </button>
      </div>
    </div>
  );
};
