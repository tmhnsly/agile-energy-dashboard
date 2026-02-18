import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { PricePoint, TimeRange } from '@/types/energy';
import { computePriceStats } from './usePriceStats';

const BASE = Date.UTC(2025, 2, 12, 0, 0);

/*
 * Four half-hourly price points (indices 0–3):
 *
 *   Slot 0: BASE          → 20p
 *   Slot 1: BASE + 30 min → 25p
 *   Slot 2: BASE + 60 min → 10p
 *   Slot 3: BASE + 90 min → 30p
 */
const points: PricePoint[] = [
  { ts: BASE, price: 20 },
  { ts: BASE + HALF_HOUR_MS, price: 25 },
  { ts: BASE + 2 * HALF_HOUR_MS, price: 10 },
  { ts: BASE + 3 * HALF_HOUR_MS, price: 30 },
];

// ── Range semantics ──────────────────────────────────────────────────
// Ranges are inclusive on both ends: [fromTs, toTs].
// This matches how computeFullRange (first → last timestamp) and the
// chart selection (snap to nearest data point) produce ranges.
// ─────────────────────────────────────────────────────────────────────

describe('computePriceStats', () => {
  describe('range semantics — inclusive [fromTs, toTs]', () => {
    it('includes all points when range spans first to last timestamp', () => {
      const range: TimeRange = { fromTs: points[0].ts, toTs: points[3].ts };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(4);
      expect(result.min).toEqual({ price: 10, ts: points[2].ts });
      expect(result.max).toEqual({ price: 30, ts: points[3].ts });
      expect(result.total).toBe(20 + 25 + 10 + 30);
    });

    it('includes both endpoints of a sub-range', () => {
      // Range from slot 1 to slot 2 — both should be counted
      const range: TimeRange = { fromTs: points[1].ts, toTs: points[2].ts };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(2);
      expect(result.min).toEqual({ price: 10, ts: points[2].ts });
      expect(result.max).toEqual({ price: 25, ts: points[1].ts });
      expect(result.total).toBe(25 + 10);
    });

    it('handles single-point range (fromTs === toTs)', () => {
      const range: TimeRange = { fromTs: points[0].ts, toTs: points[0].ts };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(1);
      expect(result.total).toBe(20);
    });

    it('handles toTs beyond last data point', () => {
      const range: TimeRange = { fromTs: BASE, toTs: BASE + 10 * HALF_HOUR_MS };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('returns null stats for an empty array', () => {
      const range: TimeRange = { fromTs: BASE, toTs: BASE + HALF_HOUR_MS };
      const result = computePriceStats([], range);

      expect(result).toEqual({ min: null, max: null, total: null, count: 0 });
    });

    it('returns null stats for out-of-range', () => {
      const range: TimeRange = { fromTs: BASE + 100 * HALF_HOUR_MS, toTs: BASE + 200 * HALF_HOUR_MS };
      const result = computePriceStats(points, range);

      expect(result).toEqual({ min: null, max: null, total: null, count: 0 });
    });

    it('handles a single point', () => {
      const single: PricePoint[] = [{ ts: BASE, price: 42 }];
      const range: TimeRange = { fromTs: single[0].ts, toTs: single[0].ts };
      const result = computePriceStats(single, range);

      expect(result.count).toBe(1);
      expect(result.min).toEqual({ price: 42, ts: BASE });
      expect(result.max).toEqual({ price: 42, ts: BASE });
      expect(result.total).toBe(42);
    });

    it('handles negative prices', () => {
      const data: PricePoint[] = [
        { ts: BASE, price: -5 },
        { ts: BASE + HALF_HOUR_MS, price: -10 },
      ];
      const range: TimeRange = { fromTs: data[0].ts, toTs: data[1].ts };
      const result = computePriceStats(data, range);

      expect(result.min).toEqual({ price: -10, ts: data[1].ts });
      expect(result.max).toEqual({ price: -5, ts: data[0].ts });
      expect(result.total).toBe(-15);
    });

    it('handles equal prices', () => {
      const data: PricePoint[] = [
        { ts: BASE, price: 15 },
        { ts: BASE + HALF_HOUR_MS, price: 15 },
      ];
      const range: TimeRange = { fromTs: data[0].ts, toTs: data[1].ts };
      const result = computePriceStats(data, range);

      expect(result.min!.price).toBe(15);
      expect(result.max!.price).toBe(15);
      expect(result.total).toBe(30);
    });
  });
});
