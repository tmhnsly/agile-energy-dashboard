'use client';

import { useState, useMemo, useCallback } from 'react';
import { HALF_HOUR_MS, HOUR_MS } from '@/utils/constants';
import { ParentSize } from '@visx/responsive';
import type { PricePoint, FlexEvent, TimeRange } from '@/types/energy';
import type { ChartSeries, ChartBand } from '@/types/chart';
import { useTimeRange } from '@/hooks/useTimeRange';
import { usePriceStats } from '@/hooks/usePriceStats';
import { formatDateTime, formatPricePerKwh } from '@/utils/format';
import { ClearSelectionButton } from '@/components/UI';
import { TimeSeriesChart, ChartLegend, DurationPresetBar } from '@/components/Charts';
import type { ChartLegendItem } from '@/components/Charts';
import { PriceStatsBar } from './PriceStatsBar/PriceStatsBar';
import { findCheapestWindow } from './findCheapestWindow';
import styles from './MarketPricePanel.module.scss';

const PRESET_HOURS = [6, 12, 24] as const;

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
    useTimeRange(prices);
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
      tone: 'secondary' as const,
    })),
  [flexEvents]);

  const legendItems: ChartLegendItem[] = useMemo(() => [
    ...chartSeries.map(s => ({ label: s.label, type: 'line' as const, tone: s.tone })),
    ...(chartBands.length > 0 ? [{ label: 'Flex event', type: 'band' as const, tone: 'secondary' as const }] : []),
  ], [chartSeries, chartBands]);

  const chartDescription = useMemo(() => {
    const from = formatDateTime(fullRange.fromTs);
    const to = formatDateTime(fullRange.toTs);
    const bandText = flexEvents.length > 0
      ? ` Flexibility events highlighted.`
      : '';
    return `Half-hourly energy prices in pence per kWh from ${from} to ${to}.${bandText} Drag to select a time range, or use keyboard arrows to navigate.`;
  }, [fullRange, flexEvents]);

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
      return 'Show All';
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
      <div className={styles.headerRow}>
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
              ariaLabel="Energy market prices"
              ariaDescription={chartDescription}
            />
          )}
        </ParentSize>
      </div>

      <div className={styles.chartLegend}>
        <ChartLegend items={legendItems} />
      </div>

      <div className={styles.chartControls}>
        <DurationPresetBar
          activePreset={activePreset}
          onPresetSelect={handlePresetSelect}
        />
        <ClearSelectionButton disabled={!isCustomRange} onClick={resetRange} />
      </div>
    </div>
  );
};
