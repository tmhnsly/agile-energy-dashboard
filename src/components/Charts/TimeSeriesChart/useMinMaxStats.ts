import { useMemo } from 'react';
import type { TimeRange } from '@/types/energy';
import type { ChartDataPoint } from '@/types/chart';
import { lowerBound } from '@/utils/binarySearch';

/**
 * Scans the primary series data within `displayRange` and returns the
 * data points with the minimum and maximum values.  Used to position
 * the min/max markers that update live during drag.
 */
export function computeMinMax(
  data: ChartDataPoint[],
  range: TimeRange,
  show: boolean,
): { min: ChartDataPoint | null; max: ChartDataPoint | null } {
  if (!show) return { min: null, max: null };
  const start = lowerBound(data, range.fromTs);
  const end = lowerBound(data, range.toTs);
  if (start >= end) return { min: null, max: null };
  let min = data[start];
  let max = data[start];
  for (let i = start + 1; i < end; i++) {
    const p = data[i];
    if (p.value < min.value) min = p;
    if (p.value > max.value) max = p;
  }
  return { min, max };
}

export function useMinMaxStats(
  primaryData: ChartDataPoint[],
  displayRange: TimeRange,
  showMinMaxMarkers: boolean,
): { min: ChartDataPoint | null; max: ChartDataPoint | null } {
  return useMemo(() => computeMinMax(primaryData, displayRange, showMinMaxMarkers), [primaryData, displayRange, showMinMaxMarkers]);
}
