'use client';

import { useState } from 'react';
import { ParentSize } from '@visx/responsive';
import type { PricePoint, FlexEvent, TimeRange } from '@/types/energy';
import { useMarketData } from '@/hooks/useMarketData';
import { usePriceRange } from '@/hooks/usePriceRange';
import { usePriceStats } from '@/hooks/usePriceStats';
import { formatDateTime } from '@/utils/format';
import { Spinner } from '@/components/Spinner/Spinner';
import { Button } from '@/components/Button/Button';
import { TimeSeriesChart } from './TimeSeriesChart/TimeSeriesChart';
import { PriceStatsBar } from './PriceStatsBar/PriceStatsBar';
import { ChartLegend } from '@/components/Chart/ChartLegend/ChartLegend';
import { QuickRangeBar } from '@/components/Chart/QuickRangeBar/QuickRangeBar';
import styles from './PriceMarketView.module.scss';

export interface PriceMarketViewProps {
  /** Supply data directly (e.g. in Storybook). When provided, skips fetching. */
  prices?: PricePoint[];
  flexEvents?: FlexEvent[];
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
        <div className={styles.loading}>
          <Spinner size="large" label="Loading market data" />
        </div>
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
        <div className={styles.headerTop}>
          <div>
            <h2 className={styles.title}>Price &amp; Market View</h2>
            <div className={styles.rangeSummary}>
              {formatDateTime(displayRange.fromTs)} &ndash;{' '}
              {formatDateTime(displayRange.toTs)}
            </div>
          </div>
          <PriceStatsBar stats={stats} />
        </div>
      </div>

      <div className={styles.chartArea}>
        <ParentSize debounceTime={0}>
          {({ width, height }) => (
            <TimeSeriesChart
              points={prices}
              flexEvents={flexEvents}
              fullRange={fullRange}
              activeRange={activeRange}
              onRangeChange={setRange}
              onRangePreview={setPreviewRange}
              width={width}
              height={height}
            />
          )}
        </ParentSize>
      </div>

      <div className={styles.chartFooter}>
        <ChartLegend />
        <Button
          label="Reset range"
          variant="soft"
          color="warning"
          size="small"
          disabled={!isCustomRange}
          onClick={resetRange}
        />
      </div>

      <QuickRangeBar
        fullRange={fullRange}
        activeRange={activeRange}
        onRangeChange={setRange}
      />
    </div>
  );
};
