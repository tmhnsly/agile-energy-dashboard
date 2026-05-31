import type { HouseholdUsageRow, PricePoint, HouseholdKey, ShiftResult } from '@/types/energy';
import { HALF_HOUR_MS } from '@/utils/constants';
import { lowerBound } from '@/utils/binarySearch';
import { computeDailyCost, simulateShift, sumPeriodUsage } from './computeFlexInsights';

/** A 6-hour slice of the settlement day (12 half-hour slots). */
export interface TimeGroup {
  key: string;
  label: string;
  /** Inclusive start slot index (0 = 00:00). */
  fromSlot: number;
  /** Exclusive end slot index. */
  toSlot: number;
  /** Human-readable clock range, e.g. "06:00–12:00". */
  range: string;
}

/** The four time groups a day is split into for the Shift Simulator. */
export const TIME_GROUPS: readonly TimeGroup[] = [
  { key: 'morning',   label: 'Morning',   fromSlot: 12, toSlot: 24, range: '06:00–12:00' },
  { key: 'afternoon', label: 'Afternoon', fromSlot: 24, toSlot: 36, range: '12:00–18:00' },
  { key: 'peak',      label: 'Peak',      fromSlot: 36, toSlot: 48, range: '18:00–00:00' },
  { key: 'night',     label: 'Night',     fromSlot: 0,  toSlot: 12, range: '00:00–06:00' },
];

const SLOTS_PER_DAY = 48;

/**
 * One aligned day of half-hour settlement periods: usage + prices bound to a
 * single midnight-anchored grid, exposing time-group slot windows and the
 * cost/shift operations that act on them.
 */
export interface SettlementDay {
  /** Midnight (start) of the day, or null when there is no usage. */
  baseTs: number | null;
  /** True when every one of the day's 48 slots maps to a real price point. */
  fullyPriced: boolean;
  /** Slot timestamps for a time group (by index into `TIME_GROUPS`). */
  groupSlots(groupIndex: number): number[];
  /** A household's total usage across a time group. */
  groupUsage(household: HouseholdKey, groupIndex: number): number;
  /** Simulate shifting `kwh` from one time group to another. */
  simulateGroupShift(
    household: HouseholdKey,
    fromIndex: number,
    toIndex: number,
    kwh: number,
  ): ShiftResult;
  /** A household's estimated daily cost for the day. */
  dailyCost(household: HouseholdKey): number;
}

/** Whether `ts` has an exact (not edge-fallback) price point. */
function hasExactPrice(prices: PricePoint[], ts: number): boolean {
  const i = lowerBound(prices, ts);
  return i < prices.length && prices[i].ts === ts;
}

/**
 * Bind a household-usage profile and a price feed into one aligned day.
 *
 * Owns the midnight anchor, the time-group slot windows, and the
 * price-coverage invariant the Shift Simulator and daily cost depend on — so
 * callers stop re-deriving slot timestamps from `usage[0].ts` and trusting
 * `lookupPrice`'s silent edge fallback. The cost/shift math itself stays in
 * `computeFlexInsights`; this composes it onto the grid.
 */
export function settlementDay(usage: HouseholdUsageRow[], prices: PricePoint[]): SettlementDay {
  const baseTs = usage.length > 0 ? usage[0].ts : null;

  const fullyPriced =
    baseTs !== null &&
    prices.length > 0 &&
    Array.from({ length: SLOTS_PER_DAY }, (_, i) => baseTs + i * HALF_HOUR_MS).every((ts) =>
      hasExactPrice(prices, ts),
    );

  const groupSlots = (groupIndex: number): number[] => {
    if (baseTs === null) return [];
    const group = TIME_GROUPS[groupIndex];
    const slots: number[] = [];
    for (let i = group.fromSlot; i < group.toSlot; i++) slots.push(baseTs + i * HALF_HOUR_MS);
    return slots;
  };

  return {
    baseTs,
    fullyPriced,
    groupSlots,
    groupUsage: (household, groupIndex) =>
      sumPeriodUsage(usage, household, groupSlots(groupIndex)),
    simulateGroupShift: (household, fromIndex, toIndex, kwh) =>
      simulateShift(usage, prices, household, groupSlots(fromIndex), groupSlots(toIndex), kwh),
    dailyCost: (household) => computeDailyCost(usage, prices, household),
  };
}
