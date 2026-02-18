'use client';

import { useMemo } from 'react';
import type { PricePoint, TimeRange, PriceStats } from '@/types/energy';
import { lowerBound, upperBound } from '@/utils/binarySearch';

/**
 * Compute min, max, total, and count statistics for the price points that
 * fall within `range`.
 *
 * Range is inclusive on both ends: [fromTs, toTs]. Uses lowerBound for
 * the start and upperBound for the end so that points whose timestamp
 * equals fromTs or toTs are both included.
 *
 * Uses binary search to avoid scanning the full array on every range
 * change — important because this hook is called on every frame during
 * a drag interaction.
 */
export function computePriceStats(
  points: PricePoint[],
  range: TimeRange,
): PriceStats {
  const start = lowerBound(points, range.fromTs);
  const end = upperBound(points, range.toTs);

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
