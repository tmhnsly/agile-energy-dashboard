'use client';

import { useMemo, useState, useCallback } from 'react';
import type { PricePoint, TimeRange } from '@/types/energy';

export function usePriceRange(points: PricePoint[]) {
  const fullRange: TimeRange = useMemo(() => {
    if (points.length === 0) return { fromTs: 0, toTs: 0 };
    return {
      fromTs: points[0].ts,
      toTs: points[points.length - 1].ts,
    };
  }, [points]);

  const [activeRange, setActiveRange] = useState<TimeRange | null>(null);

  const currentRange = activeRange ?? fullRange;

  const isCustomRange =
    currentRange.fromTs !== fullRange.fromTs ||
    currentRange.toTs !== fullRange.toTs;

  const setRange = useCallback((range: TimeRange) => {
    if (!isFinite(range.fromTs) || !isFinite(range.toTs)) return;
    if (range.toTs <= range.fromTs) return;
    setActiveRange(range);
  }, []);

  const resetRange = useCallback(() => {
    setActiveRange(null);
  }, []);

  return { fullRange, activeRange: currentRange, isCustomRange, setRange, resetRange };
}
