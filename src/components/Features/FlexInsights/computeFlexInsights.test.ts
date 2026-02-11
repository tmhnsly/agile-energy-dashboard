import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { HouseholdUsageRow, PricePoint, FlexEvent } from '@/types/energy';
import { computeDailyCost, computeFlexEarnings, simulateShift } from './computeFlexInsights';

// ---------------------------------------------------------------------------
// Test data — four half-hour slots starting at midnight on 2025-03-13
// ---------------------------------------------------------------------------

const DAY_START = Date.UTC(2025, 2, 13); // midnight 2025-03-13

/** Return the timestamp for half-hour slot `n` (0 = 00:00, 1 = 00:30, …). */
const slot = (n: number) => DAY_START + n * HALF_HOUR_MS;

//  Slot  Time   Price   Standard  HeatPump  HP+Battery
//  ────  ─────  ─────   ────────  ────────  ──────────
//   0    00:00   20p     1.0 kWh   2.0       1.5
//   1    00:30   10p     0.5 kWh   1.0       0.8
//   2    01:00   40p     0.8 kWh   1.5       1.2
//   3    01:30   30p     0.3 kWh   0.5       0.4

const prices: PricePoint[] = [
  { ts: slot(0), price: 20 },
  { ts: slot(1), price: 10 },
  { ts: slot(2), price: 40 },
  { ts: slot(3), price: 30 },
];

const usage: HouseholdUsageRow[] = [
  { ts: slot(0), standard: 1.0, heatPump: 2.0, heatPumpBattery: 1.5 },
  { ts: slot(1), standard: 0.5, heatPump: 1.0, heatPumpBattery: 0.8 },
  { ts: slot(2), standard: 0.8, heatPump: 1.5, heatPumpBattery: 1.2 },
  { ts: slot(3), standard: 0.3, heatPump: 0.5, heatPumpBattery: 0.4 },
];

// Standard daily cost = (1.0×20) + (0.5×10) + (0.8×40) + (0.3×30) = 66p
const STANDARD_DAILY_COST = 66;

// ---------------------------------------------------------------------------
// computeDailyCost
// ---------------------------------------------------------------------------

describe('computeDailyCost', () => {
  it('sums kWh × price for each slot', () => {
    expect(computeDailyCost(usage, prices, 'standard')).toBeCloseTo(STANDARD_DAILY_COST);
  });

  it('works for different households', () => {
    // heatPump: (2×20) + (1×10) + (1.5×40) + (0.5×30) = 125p
    expect(computeDailyCost(usage, prices, 'heatPump')).toBeCloseTo(125);
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
      startTs: slot(0),
      endTs: slot(2),        // 00:00–01:00, covers slots 0 and 1
      label: 'turn down',
      pricePerKwh: 1.5,
      minFlexKwh: 0,
      maxFlexKwh: 10,
    }];

    const results = computeFlexEarnings(events, usage, 'standard');
    expect(results).toHaveLength(1);
    // Standard usage in window: 1.0 + 0.5 = 1.5 kWh
    expect(results[0].shiftableKwh).toBeCloseTo(1.5);
    // Earnings: 1.5 kWh × £1.50/kWh × 100 = 225p
    expect(results[0].earningsPence).toBeCloseTo(225);
  });

  it('clamps shiftable kWh to maxFlexKwh', () => {
    const events: FlexEvent[] = [{
      id: 'e1',
      startTs: slot(0),
      endTs: slot(2),
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
      startTs: slot(0),
      endTs: slot(1),         // only slot 0 — standard = 1.0 kWh
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
      startTs: slot(0),
      endTs: slot(1),
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
  it('saves money when shifting from an expensive slot to a cheap one', () => {
    // Move 0.5 kWh from 01:00 (40p/kWh) → 00:30 (10p/kWh)
    const result = simulateShift(
      usage, prices, 'standard',
      [slot(2)], [slot(1)],
      0.5,
    );

    expect(result.originalCostPence).toBeCloseTo(STANDARD_DAILY_COST);
    // Saving: 0.5 × (40 − 10) = 15p
    expect(result.newCostPence).toBeCloseTo(51);
    expect(result.savingPence).toBeCloseTo(15);
  });

  it('costs more when shifting to a more expensive slot', () => {
    // Move 0.5 kWh from 00:30 (10p/kWh) → 01:00 (40p/kWh)
    const result = simulateShift(
      usage, prices, 'standard',
      [slot(1)], [slot(2)],
      0.5,
    );

    expect(result.savingPence).toBeCloseTo(-15);
  });

  it('clamps the shift to the available energy in the from-slot', () => {
    // Request 5 kWh from slot 0 which only has 1.0 kWh — only 1.0 is moved
    const result = simulateShift(
      usage, prices, 'standard',
      [slot(0)], [slot(1)],
      5.0,
    );

    // Slot 0 zeroed out, slot 1 gains 1.0 kWh:
    //   (0×20) + (1.5×10) + (0.8×40) + (0.3×30) = 56p
    expect(result.newCostPence).toBeCloseTo(56);
  });

  it('returns zero saving for zero shift', () => {
    const result = simulateShift(
      usage, prices, 'standard',
      [slot(0)], [slot(1)],
      0,
    );

    expect(result.savingPence).toBeCloseTo(0);
    expect(result.originalCostPence).toBe(result.newCostPence);
  });

  it('distributes removal proportionally across a multi-slot from-period', () => {
    // Move 1.0 kWh from slots 0+1 → slots 2+3
    //   From-period total = 1.0 + 0.5 = 1.5 kWh
    //   Slot 0 gives up 1.0 × (1.0/1.5) = 2/3 → left with 1/3
    //   Slot 1 gives up 1.0 × (0.5/1.5) = 1/3 → left with 1/6
    //   Slots 2+3 each receive 1.0/2 = 0.5
    const result = simulateShift(
      usage, prices, 'standard',
      [slot(0), slot(1)],
      [slot(2), slot(3)],
      1.0,
    );

    // New cost: (1/3×20) + (1/6×10) + (1.3×40) + (0.8×30) = 84.33p
    const expectedNewCost = (1 / 3) * 20 + (1 / 6) * 10 + 1.3 * 40 + 0.8 * 30;
    expect(result.originalCostPence).toBeCloseTo(STANDARD_DAILY_COST);
    expect(result.savingPence).toBeCloseTo(STANDARD_DAILY_COST - expectedNewCost);
  });

  it('returns zero saving when from and to periods are identical', () => {
    // Same slots on both sides — shifting within the same period is a no-op
    const slots = [slot(0), slot(1)];
    const result = simulateShift(usage, prices, 'standard', slots, slots, 1.0);

    expect(result.savingPence).toBe(0);
    expect(result.originalCostPence).toBe(result.newCostPence);
  });

  it('ignores overlapping slots in partially overlapping periods', () => {
    // From: slots 0+1, To: slots 1+2 — slot 1 overlaps, so effective shift
    // is from slot 0 only → to slot 2 only
    const result = simulateShift(
      usage, prices, 'standard',
      [slot(0), slot(1)],
      [slot(1), slot(2)],
      0.5,
    );

    // Only slot 0 (20p) → slot 2 (40p), so this costs more
    // Saving: 0.5 × (20 − 40) = −10p
    expect(result.savingPence).toBeCloseTo(-10);
  });
});
