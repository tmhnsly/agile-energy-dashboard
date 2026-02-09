'use client';

import { useState, useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import type { PricePoint, FlexEvent, TimeRange } from '@/types/energy';
import type { ChartSeries, ChartBand } from '@/types/chart';
import { useMarketData } from '@/hooks/useMarketData';
import { usePriceRange } from '@/hooks/usePriceRange';
import { usePriceStats } from '@/hooks/usePriceStats';
import { formatDateTime, formatPricePerKwh } from '@/utils/format';
import { Spinner } from '@/components/Spinner/Spinner';
import { Button } from '@/components/Button/Button';
import { TimeSeriesChart, ChartLegend, QuickRangeBar } from '@/components/Charts';
import { PriceStatsBar } from './PriceStatsBar/PriceStatsBar';
import styles from './PriceMarketView.module.scss';

function formatYTickWithUnit(v: number): string {
  return `${Number(v).toFixed(0)}p`;
}

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

  const chartSeries: ChartSeries[] = useMemo(() => [{
    id: 'price',
    label: 'Price (inc. VAT)',
    data: prices.map(p => ({ ts: p.ts, value: p.price })),
    tone: 'accent' as const,
  }], [prices]);

  const chartBands: ChartBand[] = useMemo(() =>
    flexEvents.map(e => ({
      id: e.id,
      startTs: e.startTs,
      endTs: e.endTs,
      label: e.label,
      tone: 'warning' as const,
    })),
  [flexEvents]);

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

      <div className={styles.chartArea}>
        <ParentSize debounceTime={50}>
          {({ width, height }) => (
            <TimeSeriesChart
              series={chartSeries}
              bands={chartBands}
              fullRange={fullRange}
              activeRange={activeRange}
              onRangeChange={setRange}
              onRangePreview={setPreviewRange}
              width={width}
              height={height}
              formatYTick={formatYTickWithUnit}
              formatTooltipValue={formatPricePerKwh}
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
