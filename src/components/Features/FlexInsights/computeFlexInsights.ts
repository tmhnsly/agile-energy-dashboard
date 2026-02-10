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
 * Uses binary search — matches exact ts or falls back to the preceding slot.
 */
function priceAt(prices: PricePoint[], ts: number): number {
  const pi = lowerBound(prices, ts);
  if (pi < prices.length && prices[pi].ts === ts) return prices[pi].price;
  if (pi > 0) return prices[pi - 1].price;
  return 0;
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

    let shiftableKwh = totalKwh;
    if (event.minFlexKwh != null) shiftableKwh = Math.max(shiftableKwh, event.minFlexKwh);
    if (event.maxFlexKwh != null) shiftableKwh = Math.min(shiftableKwh, event.maxFlexKwh);

    // If min > max or clamped to 0, clamp floor at 0
    shiftableKwh = Math.max(0, shiftableKwh);

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

  // Create modified usage with the shift applied
  const modified = usage.map((row) => {
    if (row.ts === fromSlotTs) {
      return { ...row, [household]: Math.max(0, row[household] - kwhToShift) };
    }
    if (row.ts === toSlotTs) {
      return { ...row, [household]: row[household] + kwhToShift };
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
