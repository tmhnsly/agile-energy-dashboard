import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { HouseholdUsageRow, PricePoint, FlexEvent } from '@/types/energy';
import { computeDailyCost, computeFlexEarnings, simulateShift } from './computeFlexInsights';

const BASE = Date.UTC(2025, 2, 13, 0, 0); // 2025-03-13 00:00 UTC

const prices: PricePoint[] = [
  { ts: BASE, price: 20 },
  { ts: BASE + HALF_HOUR_MS, price: 10 },
  { ts: BASE + 2 * HALF_HOUR_MS, price: 40 },
  { ts: BASE + 3 * HALF_HOUR_MS, price: 30 },
];

const usage: HouseholdUsageRow[] = [
  { ts: BASE, standard: 1.0, heatPump: 2.0, heatPumpBattery: 1.5 },
  { ts: BASE + HALF_HOUR_MS, standard: 0.5, heatPump: 1.0, heatPumpBattery: 0.8 },
  { ts: BASE + 2 * HALF_HOUR_MS, standard: 0.8, heatPump: 1.5, heatPumpBattery: 1.2 },
  { ts: BASE + 3 * HALF_HOUR_MS, standard: 0.3, heatPump: 0.5, heatPumpBattery: 0.4 },
];

// ---------------------------------------------------------------------------
// computeDailyCost
// ---------------------------------------------------------------------------

describe('computeDailyCost', () => {
  it('sums kWh × price for each slot', () => {
    // standard: 1*20 + 0.5*10 + 0.8*40 + 0.3*30 = 20 + 5 + 32 + 9 = 66
    const cost = computeDailyCost(usage, prices, 'standard');
    expect(cost).toBeCloseTo(66);
  });

  it('works for different households', () => {
    // heatPump: 2*20 + 1*10 + 1.5*40 + 0.5*30 = 40 + 10 + 60 + 15 = 125
    const cost = computeDailyCost(usage, prices, 'heatPump');
    expect(cost).toBeCloseTo(125);
  });

  it('returns 0 for empty usage', () => {
    expect(computeDailyCost([], prices, 'standard')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeFlexEarnings
// ---------------------------------------------------------------------------

describe('computeFlexEarnings', () => {
  it('computes earnings for an event with pricePerKwh', () => {
    const events: FlexEvent[] = [{
      id: 'e1',
      startTs: BASE,
      endTs: BASE + 2 * HALF_HOUR_MS, // covers slots 0 and 1
      label: 'turn down',
      pricePerKwh: 1.5,
      minFlexKwh: 0,
      maxFlexKwh: 10,
    }];

    const results = computeFlexEarnings(events, usage, 'standard');
    expect(results).toHaveLength(1);
    // standard usage in [0, 1): 1.0 + 0.5 = 1.5 kWh
    expect(results[0].shiftableKwh).toBeCloseTo(1.5);
    // earnings: 1.5 * 1.5 * 100 = 225 pence
    expect(results[0].earningsPence).toBeCloseTo(225);
  });

  it('clamps shiftable kWh to maxFlexKwh', () => {
    const events: FlexEvent[] = [{
      id: 'e1',
      startTs: BASE,
      endTs: BASE + 2 * HALF_HOUR_MS,
      pricePerKwh: 2.0,
      maxFlexKwh: 1.0,
    }];

    const results = computeFlexEarnings(events, usage, 'standard');
    expect(results[0].shiftableKwh).toBe(1.0);
    expect(results[0].earningsPence).toBeCloseTo(200);
  });

  it('raises shiftable kWh to minFlexKwh', () => {
    const events: FlexEvent[] = [{
      id: 'e1',
      startTs: BASE,
      endTs: BASE + HALF_HOUR_MS, // only slot 0: standard = 1.0
      pricePerKwh: 1.0,
      minFlexKwh: 2.0,
      maxFlexKwh: 5.0,
    }];

    const results = computeFlexEarnings(events, usage, 'standard');
    expect(results[0].shiftableKwh).toBe(2.0);
  });

  it('skips events without pricePerKwh', () => {
    const events: FlexEvent[] = [{
      id: 'e1',
      startTs: BASE,
      endTs: BASE + HALF_HOUR_MS,
      label: 'no price',
    }];

    expect(computeFlexEarnings(events, usage, 'standard')).toEqual([]);
  });

  it('returns empty array for empty events', () => {
    expect(computeFlexEarnings([], usage, 'standard')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// simulateShift
// ---------------------------------------------------------------------------

describe('simulateShift', () => {
  it('computes cost saving when shifting from expensive to cheap slot', () => {
    // Shift 0.5 kWh from slot 2 (price=40) to slot 1 (price=10)
    const result = simulateShift(
      usage, prices, 'standard',
      BASE + 2 * HALF_HOUR_MS,
      BASE + HALF_HOUR_MS,
      0.5,
    );

    // Original: 66, new: 66 - 0.5*40 + 0.5*10 = 66 - 20 + 5 = 51
    expect(result.originalCostPence).toBeCloseTo(66);
    expect(result.newCostPence).toBeCloseTo(51);
    expect(result.savingPence).toBeCloseTo(15);
  });

  it('returns negative saving when shifting to a more expensive slot', () => {
    // Shift 0.5 kWh from slot 1 (price=10) to slot 2 (price=40)
    const result = simulateShift(
      usage, prices, 'standard',
      BASE + HALF_HOUR_MS,
      BASE + 2 * HALF_HOUR_MS,
      0.5,
    );

    expect(result.savingPence).toBeCloseTo(-15);
  });

  it('does not let from-slot go negative and only shifts what was removed', () => {
    // Shift more than available (standard slot 0 has 1.0 kWh)
    const result = simulateShift(
      usage, prices, 'standard',
      BASE,
      BASE + HALF_HOUR_MS,
      5.0,
    );

    // from-slot has 1.0 kWh, so only 1.0 kWh is actually shifted (not 5.0).
    // Original: 66, new: (0*20) + (0.5+1.0)*10 + 0.8*40 + 0.3*30 = 0 + 15 + 32 + 9 = 56
    expect(result.newCostPence).toBeCloseTo(0 * 20 + 1.5 * 10 + 0.8 * 40 + 0.3 * 30);
  });

  it('handles zero kwhToShift', () => {
    const result = simulateShift(usage, prices, 'standard', BASE, BASE + HALF_HOUR_MS, 0);
    expect(result.savingPence).toBeCloseTo(0);
    expect(result.originalCostPence).toBe(result.newCostPence);
  });
});
