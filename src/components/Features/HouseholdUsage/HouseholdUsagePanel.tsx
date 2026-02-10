'use client';

import { useState, useMemo, useCallback } from 'react';
import { ParentSize } from '@visx/responsive';
import type { HouseholdUsageRow, PricePoint, TimeRange, HouseholdKey } from '@/types/energy';
import type { ChartSeries } from '@/types/chart';
import { useTimeRange } from '@/hooks/useTimeRange';
import { useUsageStats } from '@/hooks/useUsageStats';
import { formatDateTime, formatKwhValue } from '@/utils/format';
import { ClearSelectionButton } from '@/components/UI';
import { TimeSeriesChart } from '@/components/Charts';
import { HouseholdSelector } from './HouseholdSelector';
import { UsageStatsBar } from './UsageStatsBar/UsageStatsBar';
import styles from './HouseholdUsagePanel.module.scss';

const ALL_KEYS: HouseholdKey[] = ['standard', 'heatPump', 'heatPumpBattery'];

const SERIES_CONFIG: Record<HouseholdKey, { label: string; tone: ChartSeries['tone'] }> = {
  standard: { label: 'Standard', tone: 'accent' },
  heatPump: { label: 'Heat Pump', tone: 'secondary' },
  heatPumpBattery: { label: 'Heat Pump + Battery', tone: 'positive' },
};

function formatYTick(v: number): string {
  return v.toFixed(1);
}

function formatTooltipValue(v: number): string {
  return formatKwhValue(v);
}

export interface HouseholdUsagePanelProps {
  usage: HouseholdUsageRow[];
  prices: PricePoint[];
}

/**
 * Pure presentation panel for household energy usage.
 * Receives resolved data via props — loading/error states are owned by the parent.
 */
export const HouseholdUsagePanel = ({
  usage,
  prices,
}: HouseholdUsagePanelProps) => {
  const [selected, setSelected] = useState<ReadonlySet<HouseholdKey>>(
    () => new Set(ALL_KEYS),
  );

  // Stable array of selected keys for hooks (avoids Set reference changes)
  const selectedKeys = useMemo(
    () => ALL_KEYS.filter(k => selected.has(k)),
    [selected],
  );

  const { fullRange, activeRange, isCustomRange, setRange, resetRange } =
    useTimeRange(usage);

  const [previewRange, setPreviewRange] = useState<TimeRange | null>(null);
  const displayRange = previewRange ?? activeRange;

  // Stats summed across all visible households
  const stats = useUsageStats(usage, prices, displayRange, selectedKeys);

  // Build chart series from selected households
  const chartSeries: ChartSeries[] = useMemo(() =>
    selectedKeys.map(key => ({
      id: key,
      label: SERIES_CONFIG[key].label,
      data: usage.map(r => ({ ts: r.ts, value: r[key] })),
      tone: SERIES_CONFIG[key].tone,
    })),
  [usage, selectedKeys]);

  const chartDescription = useMemo(() => {
    const from = formatDateTime(fullRange.fromTs);
    const to = formatDateTime(fullRange.toTs);
    const names = selectedKeys.map(k => SERIES_CONFIG[k].label);
    const mode = names.length === ALL_KEYS.length
      ? 'all three household types overlaid'
      : names.join(' and ');
    return `Half-hourly energy usage in kWh from ${from} to ${to}, showing ${mode}. Drag to select a time range, or use keyboard arrows to navigate.`;
  }, [fullRange, selectedKeys]);

  const handleToggle = useCallback((next: ReadonlySet<HouseholdKey>) => {
    setSelected(next);
  }, []);

  return (
    <div className={styles.content}>
      <div className={styles.headerTop}>
        <div className={styles.headerGroup}>
          <h2 className={styles.title}>Household Usage</h2>
          <div className={styles.rangeSummary}>
            <span>{formatDateTime(displayRange.fromTs)} &ndash;</span>
            <span>{formatDateTime(displayRange.toTs)}</span>
          </div>
        </div>
        <UsageStatsBar stats={stats} range={displayRange} />
      </div>

      <div className={styles.chartArea}>
        <ParentSize debounceTime={50}>
          {({ width, height }) => (
            <TimeSeriesChart
              series={chartSeries}
              fullRange={fullRange}
              activeRange={activeRange}
              onRangeChange={setRange}
              onRangePreview={setPreviewRange}
              width={width}
              height={height}
              formatYTick={formatYTick}
              formatTooltipValue={formatTooltipValue}
              showMinMaxMarkers={selectedKeys.length === 1}
              ariaLabel="Household energy usage"
              ariaDescription={chartDescription}
            />
          )}
        </ParentSize>
      </div>

      <div className={styles.chartControls}>
        <HouseholdSelector selected={selected} onToggle={handleToggle} />
      </div>

      <ClearSelectionButton disabled={!isCustomRange} onClick={resetRange} />
    </div>
  );
};
