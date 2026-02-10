import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { HouseholdUsageRow, PricePoint } from '@/types/energy';
import { computeUsageStats } from './useUsageStats';
const BASE = Date.UTC(2025, 2, 12, 0, 0);

const usage: HouseholdUsageRow[] = [
  { ts: BASE,                  standard: 0.5, heatPump: 1.0, heatPumpBattery: 0.3 },
  { ts: BASE + HALF_HOUR_MS,      standard: 0.8, heatPump: 1.2, heatPumpBattery: 0.4 },
  { ts: BASE + 2 * HALF_HOUR_MS,  standard: 0.3, heatPump: 0.9, heatPumpBattery: 0.2 },
  { ts: BASE + 3 * HALF_HOUR_MS,  standard: 1.0, heatPump: 1.5, heatPumpBattery: 0.6 },
];

const prices: PricePoint[] = [
  { ts: BASE,                  price: 20 },
  { ts: BASE + HALF_HOUR_MS,      price: 25 },
  { ts: BASE + 2 * HALF_HOUR_MS,  price: 15 },
  { ts: BASE + 3 * HALF_HOUR_MS,  price: 30 },
];

describe('computeUsageStats', () => {
  it('computes totals over the full range', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, 'standard');

    expect(result.count).toBe(4);
    expect(result.totalKwh).toBeCloseTo(0.5 + 0.8 + 0.3 + 1.0);
    // cost = 0.5*20 + 0.8*25 + 0.3*15 + 1.0*30 = 10 + 20 + 4.5 + 30 = 64.5
    expect(result.estimatedCostPence).toBeCloseTo(64.5);
  });

  it('finds the peak row', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, 'standard');

    expect(result.peak).toEqual({ kwh: 1.0, ts: BASE + 3 * HALF_HOUR_MS });
  });

  it('finds the low row', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, 'standard');

    expect(result.low).toEqual({ kwh: 0.3, ts: BASE + 2 * HALF_HOUR_MS });
  });

  it('respects range boundaries', () => {
    const range = { fromTs: BASE + HALF_HOUR_MS, toTs: BASE + 3 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, 'standard');

    expect(result.count).toBe(2);
    expect(result.totalKwh).toBeCloseTo(0.8 + 0.3);
  });

  it('works for heatPump household', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, 'heatPump');

    expect(result.totalKwh).toBeCloseTo(1.0 + 1.2 + 0.9 + 1.5);
    expect(result.peak).toEqual({ kwh: 1.5, ts: BASE + 3 * HALF_HOUR_MS });
    expect(result.low).toEqual({ kwh: 0.9, ts: BASE + 2 * HALF_HOUR_MS });
  });

  it('returns empty stats for an empty range', () => {
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

  it('sums across multiple household keys', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, ['standard', 'heatPump']);

    // total = sum of standard (2.6) + heatPump (4.6)
    expect(result.totalKwh).toBeCloseTo(0.5 + 0.8 + 0.3 + 1.0 + 1.0 + 1.2 + 0.9 + 1.5);
    expect(result.count).toBe(4);
  });

  it('finds peak across multiple keys', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, ['standard', 'heatPump']);

    // heatPump row 3 = 1.5 is the highest individual value
    expect(result.peak).toEqual({ kwh: 1.5, ts: BASE + 3 * HALF_HOUR_MS });
  });

  it('sums cost across multiple keys', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const single1 = computeUsageStats(usage, prices, range, 'standard');
    const single2 = computeUsageStats(usage, prices, range, 'heatPump');
    const multi = computeUsageStats(usage, prices, range, ['standard', 'heatPump']);

    expect(multi.estimatedCostPence).toBeCloseTo(
      single1.estimatedCostPence + single2.estimatedCostPence,
    );
  });

  it('handles empty keys array', () => {
    const range = { fromTs: BASE, toTs: BASE + 4 * HALF_HOUR_MS };
    const result = computeUsageStats(usage, prices, range, []);

    expect(result.count).toBe(0);
    expect(result.totalKwh).toBe(0);
  });
});
