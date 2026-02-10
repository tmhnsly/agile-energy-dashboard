'use client';

import { useState, useMemo, useCallback } from 'react';
import { ParentSize } from '@visx/responsive';
import type { PricePoint, FlexEvent, TimeRange } from '@/types/energy';
import type { ChartSeries, ChartBand } from '@/types/chart';
import { usePriceRange } from '@/hooks/usePriceRange';
import { usePriceStats } from '@/hooks/usePriceStats';
import { formatDateTime, formatPricePerKwh } from '@/utils/format';
import { Button } from '@/components/Button/Button';
import { TimeSeriesChart, ChartLegend, QuickRangeBar } from '@/components/Charts';
import { PriceStatsBar } from './PriceStatsBar/PriceStatsBar';
import { findCheapestWindow } from './findCheapestWindow';
import styles from './MarketPricePanel.module.scss';

const HOUR_MS = 3_600_000;
const HALF_HOUR_MS = 30 * 60_000;
const PRESET_HOURS = [6, 12, 24, 48] as const;

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

  /* ── Cheapest-window presets ────────────────────── */

  /** Memoised cheapest window per preset duration. Recomputes only when data or fullRange changes. */
  const cheapestWindows = useMemo(() => {
    const data = chartSeries[0]?.data ?? [];
    const windows = new Map<number, TimeRange | null>();
    for (const hours of PRESET_HOURS) {
      windows.set(hours, findCheapestWindow(data, fullRange, hours * HOUR_MS));
    }
    return windows;
  }, [chartSeries, fullRange]);

  /** Derive active preset label from current range duration (duration-locked matching). */
  const activePreset = useMemo((): string | null => {
    if (
      activeRange.fromTs === fullRange.fromTs &&
      activeRange.toTs === fullRange.toTs
    ) {
      return 'All';
    }
    const durationMs = activeRange.toTs - activeRange.fromTs;
    for (const hours of PRESET_HOURS) {
      if (Math.abs(durationMs - hours * HOUR_MS) < HALF_HOUR_MS) {
        return `${hours}h`;
      }
    }
    return null;
  }, [activeRange, fullRange]);

  const handlePresetSelect = useCallback((hours: number | null) => {
    if (hours === null) {
      resetRange();
    } else {
      const window = cheapestWindows.get(hours);
      if (window) setRange(window);
    }
  }, [cheapestWindows, setRange, resetRange]);

  return (
    <div className={styles.content}>
      <div className={styles.headerTop}>
        <div className={styles.headerGroup}>
          <h2 className={styles.title}>Market Price</h2>
          <div className={styles.rangeSummary}>
            <span>{formatDateTime(displayRange.fromTs)} &ndash;</span>
            <span>{formatDateTime(displayRange.toTs)}</span>
          </div>
        </div>
        <PriceStatsBar stats={stats} range={displayRange} />
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
        activePreset={activePreset}
        onPresetSelect={handlePresetSelect}
      />
    </div>
  );
};
