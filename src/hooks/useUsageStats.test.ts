import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { HouseholdUsageRow, PricePoint } from '@/types/energy';
import { computeUsageStats } from './useUsageStats';

const BASE = Date.UTC(2025, 2, 12, 0, 0);

/*
 * Four half-hourly slots (indices 0–3):
 *
 *   Slot 0: BASE              → standard 0.5  heatPump 1.0  @ 20p
 *   Slot 1: BASE + 30 min     → standard 0.8  heatPump 1.2  @ 25p
 *   Slot 2: BASE + 60 min     → standard 0.3  heatPump 0.9  @ 15p
 *   Slot 3: BASE + 90 min     → standard 1.0  heatPump 1.5  @ 30p
 */
const usage: HouseholdUsageRow[] = [
  { ts: BASE,                     standard: 0.5, heatPump: 1.0, heatPumpBattery: 0.3 },
  { ts: BASE + HALF_HOUR_MS,      standard: 0.8, heatPump: 1.2, heatPumpBattery: 0.4 },
  { ts: BASE + 2 * HALF_HOUR_MS,  standard: 0.3, heatPump: 0.9, heatPumpBattery: 0.2 },
  { ts: BASE + 3 * HALF_HOUR_MS,  standard: 1.0, heatPump: 1.5, heatPumpBattery: 0.6 },
];

const prices: PricePoint[] = [
  { ts: BASE,                     price: 20 },
  { ts: BASE + HALF_HOUR_MS,      price: 25 },
  { ts: BASE + 2 * HALF_HOUR_MS,  price: 15 },
  { ts: BASE + 3 * HALF_HOUR_MS,  price: 30 },
];

// ── Range semantics ──────────────────────────────────────────────────
// Ranges are inclusive on both ends: [fromTs, toTs].
// This matches how computeFullRange (first → last timestamp) and the
// chart selection (snap to nearest data point) produce ranges.
// ─────────────────────────────────────────────────────────────────────

describe('computeUsageStats', () => {
  describe('range semantics — inclusive [fromTs, toTs]', () => {
    it('includes all slots when range spans first to last timestamp', () => {
      // This is the range computeFullRange produces: fromTs = slot 0, toTs = slot 3
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, 'standard');

      expect(result.count).toBe(4);
      expect(result.totalKwh).toBeCloseTo(
        usage[0].standard + usage[1].standard + usage[2].standard + usage[3].standard,
      );
    });

    it('includes both endpoints of a sub-range', () => {
      // Range from slot 1 to slot 2 — both should be counted
      const range = { fromTs: usage[1].ts, toTs: usage[2].ts };
      const result = computeUsageStats(usage, prices, range, 'standard');

      expect(result.count).toBe(2);
      expect(result.totalKwh).toBeCloseTo(usage[1].standard + usage[2].standard);
    });

    it('excludes elements outside the range', () => {
      // Range covers slots 1–2; slot 0 and slot 3 must not contribute
      const range = { fromTs: usage[1].ts, toTs: usage[2].ts };
      const result = computeUsageStats(usage, prices, range, 'standard');

      const allKwh = usage[0].standard + usage[1].standard + usage[2].standard + usage[3].standard;
      expect(result.totalKwh).toBeLessThan(allKwh);
      expect(result.totalKwh).toBeCloseTo(allKwh - usage[0].standard - usage[3].standard);
    });

    it('handles single-slot range (fromTs === toTs)', () => {
      const range = { fromTs: usage[2].ts, toTs: usage[2].ts };
      const result = computeUsageStats(usage, prices, range, 'standard');

      expect(result.count).toBe(1);
      expect(result.totalKwh).toBeCloseTo(usage[2].standard);
      expect(result.estimatedCostPence).toBeCloseTo(usage[2].standard * prices[2].price);
    });

    it('handles toTs beyond last data point', () => {
      const range = { fromTs: BASE, toTs: BASE + 10 * HALF_HOUR_MS };
      const result = computeUsageStats(usage, prices, range, 'standard');

      expect(result.count).toBe(4);
    });
  });

  describe('cost calculation', () => {
    it('computes cost as sum of kWh × price for each slot', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, 'standard');

      // cost = 0.5×20 + 0.8×25 + 0.3×15 + 1.0×30 = 10 + 20 + 4.5 + 30 = 64.5
      const expectedCost = usage.reduce(
        (sum, row, i) => sum + row.standard * prices[i].price, 0,
      );
      expect(result.estimatedCostPence).toBeCloseTo(expectedCost);
      expect(result.estimatedCostPence).toBeCloseTo(64.5);
    });
  });

  describe('peak and low tracking', () => {
    it('finds the peak row', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, 'standard');

      expect(result.peak).toEqual({ kwh: 1.0, ts: usage[3].ts });
    });

    it('finds the low row', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, 'standard');

      expect(result.low).toEqual({ kwh: 0.3, ts: usage[2].ts });
    });
  });

  describe('household variants', () => {
    it('works for heatPump household', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, 'heatPump');

      expect(result.totalKwh).toBeCloseTo(
        usage[0].heatPump + usage[1].heatPump + usage[2].heatPump + usage[3].heatPump,
      );
      expect(result.peak).toEqual({ kwh: 1.5, ts: usage[3].ts });
      expect(result.low).toEqual({ kwh: 0.9, ts: usage[2].ts });
    });

    it('sums across multiple household keys', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, ['standard', 'heatPump']);

      const expectedKwh = usage.reduce(
        (sum, row) => sum + row.standard + row.heatPump, 0,
      );
      expect(result.totalKwh).toBeCloseTo(expectedKwh);
      expect(result.count).toBe(4);
    });

    it('finds peak across multiple keys', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, ['standard', 'heatPump']);

      // heatPump slot 3 (1.5) is the highest individual value
      expect(result.peak).toEqual({ kwh: 1.5, ts: usage[3].ts });
    });

    it('sums cost across multiple keys', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const single1 = computeUsageStats(usage, prices, range, 'standard');
      const single2 = computeUsageStats(usage, prices, range, 'heatPump');
      const multi = computeUsageStats(usage, prices, range, ['standard', 'heatPump']);

      expect(multi.estimatedCostPence).toBeCloseTo(
        single1.estimatedCostPence + single2.estimatedCostPence,
      );
    });
  });

  describe('edge cases', () => {
    it('returns empty stats when range is outside data', () => {
      const range = { fromTs: BASE + 10 * HALF_HOUR_MS, toTs: BASE + 12 * HALF_HOUR_MS };
      const result = computeUsageStats(usage, prices, range, 'standard');

      expect(result).toEqual({
        totalKwh: 0,
        estimatedCostPence: 0,
        peak: null,
        low: null,
        count: 0,
      });
    });

    it('handles empty arrays', () => {
      const range = { fromTs: BASE, toTs: BASE + HALF_HOUR_MS };
      const result = computeUsageStats([], [], range, 'standard');

      expect(result.count).toBe(0);
      expect(result.peak).toBeNull();
    });

    it('handles empty keys array', () => {
      const range = { fromTs: usage[0].ts, toTs: usage[3].ts };
      const result = computeUsageStats(usage, prices, range, []);

      expect(result.count).toBe(0);
      expect(result.totalKwh).toBe(0);
    });

    it('falls back to first price when usage timestamp is before all prices', () => {
      // Usage starts 1 hour before prices — should use the first price (20p),
      // not zero. This matches lookupPrice in computeFlexInsights.
      const earlyUsage: HouseholdUsageRow[] = [
        { ts: BASE - HALF_HOUR_MS, standard: 1.0, heatPump: 0, heatPumpBattery: 0 },
        ...usage,
      ];
      const range = { fromTs: earlyUsage[0].ts, toTs: earlyUsage[0].ts };
      const result = computeUsageStats(earlyUsage, prices, range, 'standard');

      // 1.0 kWh × 20p (first available price) = 20p, not 0p
      expect(result.estimatedCostPence).toBeCloseTo(1.0 * prices[0].price);
    });
  });
});
