'use client';

import { useState, useMemo, useCallback } from 'react';
import { TbTriangleFilled, TbBoltFilled } from 'react-icons/tb';
import { ParentSize } from '@visx/responsive';
import { ALL_HOUSEHOLD_KEYS, type HouseholdUsageRow, type PricePoint, type TimeRange, type HouseholdKey } from '@/types/energy';
import type { ChartSeries } from '@/types/chart';
import { HOUSEHOLD_THEMES } from '@/config/households';
import { useTimeRange } from '@/hooks/useTimeRange';
import { useUsageStats } from '@/hooks/useUsageStats';
import { formatDateTime, formatKwhValue, formatCostPence } from '@/utils/format';
import { ClearSelectionButton, StatsBar } from '@/components/UI';
import { TimeSeriesChart } from '@/components/Charts';
import { HouseholdSelector } from './HouseholdSelector';
import styles from './HouseholdUsagePanel.module.scss';

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
    () => new Set(ALL_HOUSEHOLD_KEYS),
  );

  const selectedKeys = useMemo(
    () => ALL_HOUSEHOLD_KEYS.filter(k => selected.has(k)),
    [selected],
  );

  const { fullRange, activeRange, isCustomRange, setRange, resetRange } =
    useTimeRange(usage);

  const [previewRange, setPreviewRange] = useState<TimeRange | null>(null);
  const displayRange = previewRange ?? activeRange;

  const stats = useUsageStats(usage, prices, displayRange, selectedKeys);

  const chartSeries: ChartSeries[] = useMemo(() =>
    selectedKeys.map(key => ({
      id: key,
      label: HOUSEHOLD_THEMES[key].label,
      data: usage.map(r => ({ ts: r.ts, value: r[key] })),
      tone: HOUSEHOLD_THEMES[key].tone,
    })),
  [usage, selectedKeys]);

  const chartDescription = useMemo(() => {
    const from = formatDateTime(fullRange.fromTs);
    const to = formatDateTime(fullRange.toTs);
    const names = selectedKeys.map(k => HOUSEHOLD_THEMES[k].label);
    const mode = names.length === ALL_HOUSEHOLD_KEYS.length
      ? 'all three household types overlaid'
      : names.join(' and ');
    return `Half-hourly energy usage in kWh from ${from} to ${to}, showing ${mode}. Drag to select a time range, or use keyboard arrows to navigate.`;
  }, [fullRange, selectedKeys]);

  const handleToggle = useCallback((next: ReadonlySet<HouseholdKey>) => {
    setSelected(next);
  }, []);

  return (
    <div className={styles.content}>
      <div className={styles.headerRow}>
        <div className={styles.headerGroup}>
          <h2 className={styles.title}>Household Usage</h2>
          <div className={styles.rangeSummary}>
            <span>{formatDateTime(displayRange.fromTs)} &ndash;</span>
            <span>{formatDateTime(displayRange.toTs)}</span>
          </div>
        </div>
        <StatsBar
          ariaLabel="Usage statistics"
          cards={[
            {
              key: 'peak',
              label: 'Peak',
              value: stats.peak ? formatKwhValue(stats.peak.kwh) : '—',
              subValue: stats.peak ? formatDateTime(stats.peak.ts) : '\u00A0',
              icon: <TbTriangleFilled aria-hidden="true" />,
              tone: 'neutral',
            },
            {
              key: 'total',
              label: 'Total (est.)',
              value: stats.count > 0 ? formatCostPence(stats.estimatedCostPence) : '—',
              subValue: stats.count > 0 ? formatKwhValue(stats.totalKwh) : '\u00A0',
              icon: <TbBoltFilled aria-hidden="true" style={{ color: 'var(--mono-solid)' }} />,
              tone: 'neutral',
            },
          ]}
        />
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
