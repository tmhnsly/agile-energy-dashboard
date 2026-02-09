'use client';

import { useState, useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import type { PricePoint, FlexEvent, TimeRange } from '@/types/energy';
import type { ChartSeries, ChartBand } from '@/types/chart';
import { usePriceRange } from '@/hooks/usePriceRange';
import { usePriceStats } from '@/hooks/usePriceStats';
import { formatDateTime, formatPricePerKwh } from '@/utils/format';
import { Button } from '@/components/Button/Button';
import { TimeSeriesChart, ChartLegend, QuickRangeBar } from '@/components/Charts';
import { PriceStatsBar } from './PriceStatsBar/PriceStatsBar';
import styles from './MarketPricePanel.module.scss';

function formatYTickWithUnit(v: number): string {
  return `${Number(v).toFixed(0)}p`;
}

export interface MarketPricePanelProps {
  prices: PricePoint[];
  flexEvents: FlexEvent[];
}

/**
 * Pure presentation panel — receives resolved data via props.
 * Loading and error states are owned by the parent tile wrapper.
 */
export const MarketPricePanel = ({
  prices,
  flexEvents,
}: MarketPricePanelProps) => {
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

  return (
    <div className={styles.content}>
      <div className={styles.headerTop}>
        <div className={styles.headerGroup}>
          <h2 className={styles.title}>Market Price</h2>
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
          label="Reset"
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
