import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { HouseholdUsageRow, PricePoint } from '@/types/energy';
import { settlementDay, TIME_GROUPS } from './settlementDay';
import { simulateShift, computeDailyCost } from './computeFlexInsights';

const DAY = Date.UTC(2026, 0, 1);
const slot = (i: number) => DAY + i * HALF_HOUR_MS;
const groupIdx = (key: string) => TIME_GROUPS.findIndex((g) => g.key === key);

// A full 48-slot day. Usage varies by slot; prices vary across periods so
// shifting between time groups produces a real cost difference.
const usage: HouseholdUsageRow[] = Array.from({ length: 48 }, (_, i) => ({
  ts: slot(i),
  standard: 0.2 + (i % 6) * 0.1,
  heatPump: 0.5,
  heatPumpBattery: 0.4,
}));
const prices: PricePoint[] = Array.from({ length: 48 }, (_, i) => ({
  ts: slot(i),
  price: 10 + (i % 12) * 3,
}));

describe('settlementDay', () => {
  it('anchors baseTs to the first usage slot', () => {
    expect(settlementDay(usage, prices).baseTs).toBe(slot(0));
  });

  it('is fullyPriced when every slot of the day has a price', () => {
    expect(settlementDay(usage, prices).fullyPriced).toBe(true);
  });

  it('is NOT fullyPriced when the day extends past the price feed', () => {
    const short = prices.slice(0, 44); // missing 22:00–23:30
    expect(settlementDay(usage, short).fullyPriced).toBe(false);
  });

  it('builds the slot timestamps for a time group', () => {
    const peak = settlementDay(usage, prices).groupSlots(groupIdx('peak'));
    expect(peak).toEqual(Array.from({ length: 12 }, (_, i) => slot(36 + i)));
  });

  it('sums a household usage across a time group', () => {
    const night = groupIdx('night'); // slots 0–11
    const expected = usage.slice(0, 12).reduce((s, r) => s + r.standard, 0);
    expect(settlementDay(usage, prices).groupUsage('standard', night)).toBeCloseTo(expected);
  });

  it('simulateGroupShift matches a direct simulateShift over the same slots', () => {
    const day = settlementDay(usage, prices);
    const from = groupIdx('peak');
    const to = groupIdx('night');
    const direct = simulateShift(usage, prices, 'standard', day.groupSlots(from), day.groupSlots(to), 1.5);
    expect(day.simulateGroupShift('standard', from, to, 1.5)).toEqual(direct);
  });

  it('dailyCost matches computeDailyCost', () => {
    expect(settlementDay(usage, prices).dailyCost('standard')).toBeCloseTo(
      computeDailyCost(usage, prices, 'standard'),
    );
  });

  it('degrades safely for empty usage', () => {
    const day = settlementDay([], prices);
    expect(day.baseTs).toBeNull();
    expect(day.fullyPriced).toBe(false);
    expect(day.groupSlots(0)).toEqual([]);
    expect(day.groupUsage('standard', 0)).toBe(0);
    expect(day.dailyCost('standard')).toBe(0);
  });
});
