'use client';

import { useMemo } from 'react';
import type { PricePoint, TimeRange, PriceStats } from '@/types/energy';

export function usePriceStats(
  points: PricePoint[],
  range: TimeRange,
): PriceStats {
  return useMemo(() => {
    const filtered = points.filter(
      (p) => p.ts >= range.fromTs && p.ts <= range.toTs,
    );

    if (filtered.length === 0) return { min: null, max: null };

    let min = filtered[0];
    let max = filtered[0];

    for (const p of filtered) {
      if (p.price < min.price) min = p;
      if (p.price > max.price) max = p;
    }

    return {
      min: { price: min.price, ts: min.ts },
      max: { price: max.price, ts: max.ts },
    };
  }, [points, range]);
}
