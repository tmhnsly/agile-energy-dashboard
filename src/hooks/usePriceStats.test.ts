import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS, HOUR_MS } from '@/utils/constants';
import type { PricePoint, TimeRange } from '@/types/energy';
import { computePriceStats } from './usePriceStats';
import { findCheapestWindow } from '@/components/Features/MarketPrice/findCheapestWindow';

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

/** Build n contiguous half-hourly price points starting at `startTs`. */
function makePrices(startTs: number, prices: number[]): PricePoint[] {
  return prices.map((price, i) => ({ ts: startTs + i * HALF_HOUR_MS, price }));
}

// ── Range semantics ──────────────────────────────────────────────────
// Ranges are HALF-OPEN: [fromTs, toTs). A slot whose ts === toTs is NOT
// counted. This matches how a duration window [start, start + duration)
// covers exactly duration/HALF_HOUR slots, and how computeFullRange pads
// its end by one bucket so the final slot is still included.
// ─────────────────────────────────────────────────────────────────────

describe('computePriceStats', () => {
  describe('range semantics — half-open [fromTs, toTs)', () => {
    it('sums all points across the padded full extent', () => {
      const range: TimeRange = { fromTs: points[0].ts, toTs: points[3].ts + HALF_HOUR_MS };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(4);
      expect(result.min).toEqual({ price: 10, ts: points[2].ts });
      expect(result.max).toEqual({ price: 30, ts: points[3].ts });
      expect(result.total).toBe(20 + 25 + 10 + 30);
    });

    it('excludes a slot sitting exactly at toTs', () => {
      // Range from slot 1 up to (not including) slot 2 — only slot 1 counts.
      const range: TimeRange = { fromTs: points[1].ts, toTs: points[2].ts };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(1);
      expect(result.total).toBe(25);
      expect(result.min).toEqual({ price: 25, ts: points[1].ts });
    });

    it('includes a slot once toTs extends past it', () => {
      // [slot1, slot2 + 30min) covers slots 1 and 2, but not slot 3.
      const range: TimeRange = { fromTs: points[1].ts, toTs: points[2].ts + HALF_HOUR_MS };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(2);
      expect(result.total).toBe(25 + 10);
      expect(result.min).toEqual({ price: 10, ts: points[2].ts });
      expect(result.max).toEqual({ price: 25, ts: points[1].ts });
    });

    it('contains no slots for a zero-width range', () => {
      const range: TimeRange = { fromTs: points[0].ts, toTs: points[0].ts };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(0);
      expect(result.total).toBeNull();
    });

    it('handles toTs beyond last data point', () => {
      const range: TimeRange = { fromTs: BASE, toTs: BASE + 10 * HALF_HOUR_MS };
      const result = computePriceStats(points, range);

      expect(result.count).toBe(4);
    });
  });

  // A duration window of D hours = [start, start + D) and must always cover
  // exactly D/0.5 half-hour slots — independent of where the start lands. This
  // is the property that stops a drag from "finding a cheaper" 6h window than
  // the preset by capturing one slot more or fewer.
  describe('slot-count stability for a fixed-width window', () => {
    const data = makePrices(
      BASE,
      Array.from({ length: 24 }, (_, i) => 10 + (i % 5)),
    );

    it('a 6h-wide range covers exactly 12 slots at every 5-minute offset', () => {
      for (let offsetMin = 0; offsetMin <= 25; offsetMin += 5) {
        const from = BASE + offsetMin * 60_000;
        const range: TimeRange = { fromTs: from, toTs: from + 6 * HOUR_MS };
        expect(computePriceStats(data, range).count).toBe(12);
      }
    });
  });

  // The preset buttons must highlight the genuinely cheapest window: the Total
  // shown for findCheapestWindow's result must equal the minimum window sum and
  // be no greater than any other equal-width window's Total.
  describe('cheapest-window integration with findCheapestWindow', () => {
    const prices = makePrices(BASE, [
      30, 28, 26, 24, 22, 20, // expensive morning
      8, 6, 5, 4, 5, 7, 6, 8, 9, 10, 11, 12, // cheap middle (cheapest 6h ~ here)
      24, 26, 28, 30, 29, 27, // expensive evening
    ]);
    const fullRange: TimeRange = {
      fromTs: prices[0].ts,
      toTs: prices[prices.length - 1].ts + HALF_HOUR_MS,
    };
    const series = prices.map((p) => ({ ts: p.ts, value: p.price }));

    function windowSum(startIdx: number, size: number): number {
      let sum = 0;
      for (let i = startIdx; i < startIdx + size; i++) sum += prices[i].price;
      return sum;
    }

    it('the chosen 6h window Total equals the minimum 12-slot sum', () => {
      const window = findCheapestWindow(series, fullRange, 6 * HOUR_MS);
      expect(window).not.toBeNull();

      const stats = computePriceStats(prices, window!);
      expect(stats.count).toBe(12);

      // Brute-force minimum sum over every contiguous 12-slot window.
      let minSum = Infinity;
      for (let i = 0; i + 12 <= prices.length; i++) {
        minSum = Math.min(minSum, windowSum(i, 12));
      }

      expect(stats.total).toBe(minSum);
    });

    it('no equal-width window shown has a lower Total than the chosen one', () => {
      const window = findCheapestWindow(series, fullRange, 6 * HOUR_MS)!;
      const chosenTotal = computePriceStats(prices, window).total!;

      for (let i = 0; i + 12 <= prices.length; i++) {
        const from = prices[i].ts;
        const candidate: TimeRange = { fromTs: from, toTs: from + 6 * HOUR_MS };
        expect(computePriceStats(prices, candidate).total!).toBeGreaterThanOrEqual(
          chosenTotal,
        );
      }
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

    it('handles a single point covered by a one-slot range', () => {
      const single: PricePoint[] = [{ ts: BASE, price: 42 }];
      const range: TimeRange = { fromTs: single[0].ts, toTs: single[0].ts + HALF_HOUR_MS };
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
      const range: TimeRange = { fromTs: data[0].ts, toTs: data[1].ts + HALF_HOUR_MS };
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
      const range: TimeRange = { fromTs: data[0].ts, toTs: data[1].ts + HALF_HOUR_MS };
      const result = computePriceStats(data, range);

      expect(result.min!.price).toBe(15);
      expect(result.max!.price).toBe(15);
      expect(result.total).toBe(30);
    });
  });
});
