'use client';

import { useMemo } from 'react';
import type { PricePoint, TimeRange, PriceStats } from '@/types/energy';
import { rangeIndices } from '@/utils/timeRange';

/**
 * Compute min, max, total, and count statistics for the price points that
 * fall within the inclusive `range`.
 *
 * `rangeIndices` owns the inclusive-range slicing (binary search, so this
 * stays cheap even when called on every frame during a drag interaction).
 */
export function computePriceStats(
  points: PricePoint[],
  range: TimeRange,
): PriceStats {
  const { start, end } = rangeIndices(points, range);

  if (start >= end) return { min: null, max: null, total: null, count: 0 };

  let min = points[start];
  let max = points[start];
  let total = points[start].price;

  for (let i = start + 1; i < end; i++) {
    const point = points[i];
    total += point.price;
    if (point.price < min.price) min = point;
    if (point.price > max.price) max = point;
  }

  return {
    min: { price: min.price, ts: min.ts },
    max: { price: max.price, ts: max.ts },
    total,
    count: end - start,
  };
}

export function usePriceStats(
  points: PricePoint[],
  range: TimeRange,
): PriceStats {
  return useMemo(() => computePriceStats(points, range), [points, range]);
}
