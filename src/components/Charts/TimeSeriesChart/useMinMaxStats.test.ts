import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { ChartDataPoint } from '@/types/chart';
import type { TimeRange } from '@/types/energy';
import { computeMinMax } from './useMinMaxStats';
const BASE = Date.UTC(2025, 2, 12, 0, 0);

const data: ChartDataPoint[] = [
  { ts: BASE, value: 5 },
  { ts: BASE + HALF_HOUR_MS, value: 10 },
  { ts: BASE + 2 * HALF_HOUR_MS, value: 2 },
  { ts: BASE + 3 * HALF_HOUR_MS, value: 8 },
];

const fullRange: TimeRange = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };

describe('computeMinMax', () => {
  it('finds standard min and max', () => {
    const result = computeMinMax(data, fullRange, true);
    expect(result.min).toEqual({ ts: BASE + 2 * HALF_HOUR_MS, value: 2 });
    expect(result.max).toEqual({ ts: BASE + HALF_HOUR_MS, value: 10 });
  });

  it('returns nulls when showMinMaxMarkers is false', () => {
    const result = computeMinMax(data, fullRange, false);
    expect(result).toEqual({ min: null, max: null });
  });

  it('returns nulls for empty range', () => {
    const emptyRange: TimeRange = { fromTs: BASE + 100 * HALF_HOUR_MS, toTs: BASE + 200 * HALF_HOUR_MS };
    const result = computeMinMax(data, emptyRange, true);
    expect(result).toEqual({ min: null, max: null });
  });

  it('handles single point (both min and max)', () => {
    const single: ChartDataPoint[] = [{ ts: BASE, value: 7 }];
    const range: TimeRange = { fromTs: BASE, toTs: BASE + HALF_HOUR_MS };
    const result = computeMinMax(single, range, true);
    expect(result.min).toEqual({ ts: BASE, value: 7 });
    expect(result.max).toEqual({ ts: BASE, value: 7 });
  });

  it('picks within sub-range only', () => {
    // Exclude first and last points
    const subRange: TimeRange = { fromTs: BASE + HALF_HOUR_MS, toTs: BASE + 3 * HALF_HOUR_MS };
    const result = computeMinMax(data, subRange, true);
    expect(result.min).toEqual({ ts: BASE + 2 * HALF_HOUR_MS, value: 2 });
    expect(result.max).toEqual({ ts: BASE + HALF_HOUR_MS, value: 10 });
  });

  it('returns nulls for empty data array', () => {
    const result = computeMinMax([], fullRange, true);
    expect(result).toEqual({ min: null, max: null });
  });
});
