import type {
  HouseholdUsageRow,
  PricePoint,
  HouseholdKey,
  FlexEvent,
  FlexEarningResult,
  ShiftResult,
} from '@/types/energy';
import { lowerBound } from '@/utils/binarySearch';

/**
 * Look up the price for a given usage row timestamp.
 * Uses binary search — matches exact ts, falls back to the preceding slot,
 * or uses the first available price if the timestamp is before all price data.
 */
function priceAt(prices: PricePoint[], ts: number): number {
  if (prices.length === 0) return 0;
  const pi = lowerBound(prices, ts);
  if (pi < prices.length && prices[pi].ts === ts) return prices[pi].price;
  if (pi > 0) return prices[pi - 1].price;
  return prices[0].price;
}

/**
 * Compute total estimated cost in pence for a household over the full usage array.
 * cost = Σ(kWh × price_p/kWh) for every half-hour slot.
 */
export function computeDailyCost(
  usage: HouseholdUsageRow[],
  prices: PricePoint[],
  household: HouseholdKey,
): number {
  let cost = 0;
  for (const row of usage) {
    cost += row[household] * priceAt(prices, row.ts);
  }
  return cost;
}

/**
 * For each flex event with `pricePerKwh`, sum the household's usage within
 * [startTs, endTs), clamp to [minFlexKwh, maxFlexKwh], and compute earnings.
 */
export function computeFlexEarnings(
  flexEvents: FlexEvent[],
  usage: HouseholdUsageRow[],
  household: HouseholdKey,
): FlexEarningResult[] {
  const results: FlexEarningResult[] = [];

  for (const event of flexEvents) {
    if (event.pricePerKwh == null) continue;

    const start = lowerBound(usage, event.startTs);
    const end = lowerBound(usage, event.endTs);

    let totalKwh = 0;
    for (let i = start; i < end; i++) {
      totalKwh += usage[i][household];
    }

    // Clamp to [minFlexKwh, maxFlexKwh]. If the event data is malformed
    // (min > max), prefer max as the hard ceiling to avoid over-promising.
    const floor = Math.max(0, event.minFlexKwh ?? 0);
    const ceiling = event.maxFlexKwh ?? Infinity;
    const effectiveCeiling = Math.max(floor, ceiling); // guard against min > max
    const shiftableKwh = Math.min(Math.max(totalKwh, floor), effectiveCeiling);

    const earningsPence = shiftableKwh * event.pricePerKwh * 100;

    results.push({ event, shiftableKwh, earningsPence });
  }

  return results;
}

/**
 * Simulate shifting `kwhToShift` from one time slot to another.
 * Returns the original cost, new cost, and the saving in pence.
 */
export function simulateShift(
  usage: HouseholdUsageRow[],
  prices: PricePoint[],
  household: HouseholdKey,
  fromSlotTs: number,
  toSlotTs: number,
  kwhToShift: number,
): ShiftResult {
  const originalCostPence = computeDailyCost(usage, prices, household);

  // Work out the actual amount removed (clamped so the from-slot doesn't go negative).
  // Only add this same amount to the to-slot — no energy is created.
  const fromRow = usage.find((r) => r.ts === fromSlotTs);
  const actualShift = fromRow
    ? Math.min(kwhToShift, fromRow[household])
    : 0;

  const modified = usage.map((row) => {
    if (row.ts === fromSlotTs) {
      return { ...row, [household]: row[household] - actualShift };
    }
    if (row.ts === toSlotTs) {
      return { ...row, [household]: row[household] + actualShift };
    }
    return row;
  });

  const newCostPence = computeDailyCost(modified, prices, household);

  return {
    originalCostPence,
    newCostPence,
    savingPence: originalCostPence - newCostPence,
  };
}
