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
function lookupPrice(prices: PricePoint[], ts: number): number {
  if (prices.length === 0) return 0;
  const priceIndex = lowerBound(prices, ts);
  if (priceIndex < prices.length && prices[priceIndex].ts === ts) return prices[priceIndex].price;
  if (priceIndex > 0) return prices[priceIndex - 1].price;
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
    cost += row[household] * lookupPrice(prices, row.ts);
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
 * Sum the household usage across a set of timestamps.
 */
export function sumPeriodUsage(
  usage: HouseholdUsageRow[],
  household: HouseholdKey,
  slotTimestamps: number[],
): number {
  const tsSet = new Set(slotTimestamps);
  let total = 0;
  for (const row of usage) {
    if (tsSet.has(row.ts)) total += row[household];
  }
  return total;
}

/**
 * Simulate shifting `kwhToShift` from one time period to another.
 *
 * Energy is removed from the from-period slots proportionally to their
 * existing usage (preserving the consumption shape) and distributed
 * evenly across the to-period slots.
 *
 * Returns the original cost, new cost, and the saving in pence.
 */
export function simulateShift(
  usage: HouseholdUsageRow[],
  prices: PricePoint[],
  household: HouseholdKey,
  fromSlots: number[],
  toSlots: number[],
  kwhToShift: number,
): ShiftResult {
  const originalCostPence = computeDailyCost(usage, prices, household);

  // Strip overlapping timestamps — shifting within the same slot is a no-op
  const toCheck = new Set(toSlots);
  const overlap = new Set(fromSlots.filter(ts => toCheck.has(ts)));
  const from = overlap.size > 0 ? fromSlots.filter(ts => !overlap.has(ts)) : fromSlots;
  const to = overlap.size > 0 ? toSlots.filter(ts => !overlap.has(ts)) : toSlots;

  const totalFromKwh = sumPeriodUsage(usage, household, from);
  const actualShift = Math.min(kwhToShift, totalFromKwh);

  if (actualShift <= 0 || to.length === 0) {
    return { originalCostPence, newCostPence: originalCostPence, savingPence: 0 };
  }

  const fromSet = new Set(from);
  const toSet = new Set(to);
  const addPerSlot = actualShift / to.length;

  const modified = usage.map((row) => {
    if (fromSet.has(row.ts)) {
      // Remove proportionally — slots with more usage give up more
      const weight = totalFromKwh > 0 ? row[household] / totalFromKwh : 0;
      return { ...row, [household]: row[household] - actualShift * weight };
    }
    if (toSet.has(row.ts)) {
      return { ...row, [household]: row[household] + addPerSlot };
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
