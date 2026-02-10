import { describe, it, expect } from 'vitest';
import { minutesToMilliseconds } from 'date-fns';
import type { PricePoint, TimeRange } from '@/types/energy';
import { computePriceStats } from './usePriceStats';

const HALF_HOUR = minutesToMilliseconds(30);
const BASE = Date.UTC(2025, 2, 12, 0, 0);

const points: PricePoint[] = [
  { ts: BASE, price: 20 },
  { ts: BASE + HALF_HOUR, price: 25 },
  { ts: BASE + 2 * HALF_HOUR, price: 10 },
  { ts: BASE + 3 * HALF_HOUR, price: 30 },
];

describe('computePriceStats', () => {
  it('computes min, max, total, count over full range', () => {
    const range: TimeRange = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR };
    const result = computePriceStats(points, range);

    expect(result.count).toBe(4);
    expect(result.min).toEqual({ price: 10, ts: BASE + 2 * HALF_HOUR });
    expect(result.max).toEqual({ price: 30, ts: BASE + 3 * HALF_HOUR });
    expect(result.total).toBe(20 + 25 + 10 + 30);
  });

  it('respects sub-range via binary search boundaries', () => {
    const range: TimeRange = { fromTs: BASE + HALF_HOUR, toTs: BASE + 3 * HALF_HOUR };
    const result = computePriceStats(points, range);

    expect(result.count).toBe(2);
    expect(result.min).toEqual({ price: 10, ts: BASE + 2 * HALF_HOUR });
    expect(result.max).toEqual({ price: 25, ts: BASE + HALF_HOUR });
    expect(result.total).toBe(25 + 10);
  });

  it('returns null stats for an empty array', () => {
    const range: TimeRange = { fromTs: BASE, toTs: BASE + HALF_HOUR };
    const result = computePriceStats([], range);

    expect(result).toEqual({ min: null, max: null, total: null, count: 0 });
  });

  it('returns null stats for out-of-range', () => {
    const range: TimeRange = { fromTs: BASE + 100 * HALF_HOUR, toTs: BASE + 200 * HALF_HOUR };
    const result = computePriceStats(points, range);

    expect(result).toEqual({ min: null, max: null, total: null, count: 0 });
  });

  it('handles a single point', () => {
    const single: PricePoint[] = [{ ts: BASE, price: 42 }];
    const range: TimeRange = { fromTs: BASE, toTs: BASE + HALF_HOUR };
    const result = computePriceStats(single, range);

    expect(result.count).toBe(1);
    expect(result.min).toEqual({ price: 42, ts: BASE });
    expect(result.max).toEqual({ price: 42, ts: BASE });
    expect(result.total).toBe(42);
  });

  it('handles negative prices', () => {
    const data: PricePoint[] = [
      { ts: BASE, price: -5 },
      { ts: BASE + HALF_HOUR, price: -10 },
    ];
    const range: TimeRange = { fromTs: BASE, toTs: BASE + 2 * HALF_HOUR };
    const result = computePriceStats(data, range);

    expect(result.min).toEqual({ price: -10, ts: BASE + HALF_HOUR });
    expect(result.max).toEqual({ price: -5, ts: BASE });
    expect(result.total).toBe(-15);
  });

  it('handles equal prices', () => {
    const data: PricePoint[] = [
      { ts: BASE, price: 15 },
      { ts: BASE + HALF_HOUR, price: 15 },
    ];
    const range: TimeRange = { fromTs: BASE, toTs: BASE + 2 * HALF_HOUR };
    const result = computePriceStats(data, range);

    expect(result.min!.price).toBe(15);
    expect(result.max!.price).toBe(15);
    expect(result.total).toBe(30);
  });

  it('uses half-open range (excludes toTs)', () => {
    // range ends exactly at point[1].ts → only point[0] included
    const range: TimeRange = { fromTs: BASE, toTs: BASE + HALF_HOUR };
    const result = computePriceStats(points, range);

    expect(result.count).toBe(1);
    expect(result.total).toBe(20);
  });
});
