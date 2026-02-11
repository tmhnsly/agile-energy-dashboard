'use client';

import { useMemo } from 'react';
import type {
  HouseholdUsageRow,
  PricePoint,
  TimeRange,
  UsageStats,
  HouseholdKey,
} from '@/types/energy';
import { lowerBound } from '@/utils/binarySearch';

/**
 * Pure computation — exported for unit testing.
 *
 * Accepts one or more household keys. When multiple keys are provided,
 * totals and cost are summed across all of them, and peak/low reflect
 * the highest/lowest individual half-hour value across all keys.
 *
 * Cost is estimated by joining each usage row with the price data via
 * binary search:  cost = Σ(kWh × price_p/kWh) for every half-hour slot.
 */
export function computeUsageStats(
  usage: HouseholdUsageRow[],
  prices: PricePoint[],
  range: TimeRange,
  households: HouseholdKey | HouseholdKey[],
): UsageStats {
  const keys = Array.isArray(households) ? households : [households];
  const start = lowerBound(usage, range.fromTs);
  const end = lowerBound(usage, range.toTs);

  if (start >= end || keys.length === 0) {
    return { totalKwh: 0, estimatedCostPence: 0, peak: null, low: null, count: 0 };
  }

  let totalKwh = 0;
  let estimatedCostPence = 0;
  let peak: { kwh: number; ts: number } | null = null;
  let low: { kwh: number; ts: number } | null = null;

  for (let i = start; i < end; i++) {
    const row = usage[i];

    // Find the matching price once per row
    const priceIndex = lowerBound(prices, row.ts);
    let price = 0;
    if (priceIndex < prices.length && prices[priceIndex].ts === row.ts) {
      price = prices[priceIndex].price;
    } else if (priceIndex > 0) {
      price = prices[priceIndex - 1].price;
    }

    for (const key of keys) {
      const kwh = row[key];
      totalKwh += kwh;
      estimatedCostPence += kwh * price;

      if (peak === null || kwh > peak.kwh) peak = { kwh, ts: row.ts };
      if (low === null || kwh < low.kwh) low = { kwh, ts: row.ts };
    }
  }

  return { totalKwh, estimatedCostPence, peak, low, count: end - start };
}

/**
 * Memoised hook wrapper — recomputes only when inputs change.
 * Uses the same `lowerBound` slice approach as `usePriceStats` so it
 * stays fast during drag interactions.
 */
export function useUsageStats(
  usage: HouseholdUsageRow[],
  prices: PricePoint[],
  range: TimeRange,
  households: HouseholdKey | HouseholdKey[],
): UsageStats {
  return useMemo(
    () => computeUsageStats(usage, prices, range, households),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usage, prices, range, households],
  );
}
