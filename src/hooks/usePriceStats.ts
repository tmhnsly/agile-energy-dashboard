'use client';

import { useMemo } from 'react';
import type { PricePoint, TimeRange, PriceStats } from '@/types/energy';
import { lowerBound, upperBound } from '@/utils/binarySearch';

export function usePriceStats(
  points: PricePoint[],
  range: TimeRange,
): PriceStats {
  return useMemo(() => {
    const start = lowerBound(points, range.fromTs);
    const end = upperBound(points, range.toTs);

    if (start >= end) return { min: null, max: null };

    let min = points[start];
    let max = points[start];

    for (let i = start + 1; i < end; i++) {
      const p = points[i];
      if (p.price < min.price) min = p;
      if (p.price > max.price) max = p;
    }

    return {
      min: { price: min.price, ts: min.ts },
      max: { price: max.price, ts: max.ts },
    };
  }, [points, range]);
}
