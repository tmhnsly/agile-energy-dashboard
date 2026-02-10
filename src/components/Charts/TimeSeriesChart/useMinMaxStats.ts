import { useMemo } from 'react';
import type { TimeRange } from '@/types/energy';
import type { ChartDataPoint } from '@/types/chart';
import { lowerBound } from '@/utils/binarySearch';

/**
 * Scans the primary series data within `displayRange` and returns the
 * data points with the minimum and maximum values.  Used to position
 * the min/max markers that update live during drag.
 */
export function useMinMaxStats(
  primaryData: ChartDataPoint[],
  displayRange: TimeRange,
  showMinMaxMarkers: boolean,
): { min: ChartDataPoint | null; max: ChartDataPoint | null } {
  return useMemo(() => {
    if (!showMinMaxMarkers) return { min: null, max: null };
    const start = lowerBound(primaryData, displayRange.fromTs);
    const end = lowerBound(primaryData, displayRange.toTs);
    if (start >= end) return { min: null, max: null };
    let min = primaryData[start];
    let max = primaryData[start];
    for (let i = start + 1; i < end; i++) {
      const p = primaryData[i];
      if (p.value < min.value) min = p;
      if (p.value > max.value) max = p;
    }
    return { min, max };
  }, [primaryData, displayRange, showMinMaxMarkers]);
}
