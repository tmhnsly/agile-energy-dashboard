import { describe, it, expect } from 'vitest';
import { UTCDate } from '@date-fns/utc';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { PricePoint } from '@/types/energy';
import { simulateShift } from '@/components/Features/FlexInsights/computeFlexInsights';
import {
  classifyFlexEvent,
  mapAgilePrices,
  mapFlexEvents,
  parseHouseholdUsageCsv,
  resolveUsageAnchor,
} from './energy-mappers';

// ---------------------------------------------------------------------------
// mapAgilePrices
// ---------------------------------------------------------------------------

describe('mapAgilePrices', () => {
  it('parses the Octopus API { results: [...] } envelope', () => {
    const raw = {
      count: 2,
      results: [
        { value_inc_vat: 25.0, valid_from: '2025-03-13T01:00:00Z', valid_to: '2025-03-13T01:30:00Z' },
        { value_inc_vat: 20.0, valid_from: '2025-03-13T00:30:00Z', valid_to: '2025-03-13T01:00:00Z' },
      ],
    };
    const prices = mapAgilePrices(raw);
    expect(prices).toHaveLength(2);
    expect(prices[0].price).toBe(20.0);
    expect(prices[1].price).toBe(25.0);
  });

  it('sorts results ascending by timestamp (API returns descending)', () => {
    const raw = {
      results: [
        { value_inc_vat: 30, valid_from: '2025-03-13T02:00:00Z' },
        { value_inc_vat: 20, valid_from: '2025-03-13T01:00:00Z' },
        { value_inc_vat: 10, valid_from: '2025-03-13T00:00:00Z' },
      ],
    };
    const prices = mapAgilePrices(raw);
    expect(prices.map(p => p.price)).toEqual([10, 20, 30]);
  });

  it('accepts a bare array', () => {
    const raw = [
      { value_inc_vat: 5.5, valid_from: '2025-01-01T00:00:00Z' },
    ];
    const prices = mapAgilePrices(raw);
    expect(prices).toHaveLength(1);
    expect(prices[0].price).toBe(5.5);
  });

  it('handles negative prices', () => {
    const raw = [{ value_inc_vat: -2.5, valid_from: '2025-03-13T03:00:00Z' }];
    const prices = mapAgilePrices(raw);
    expect(prices[0].price).toBe(-2.5);
  });

  it('skips items with missing fields', () => {
    const raw = [
      { value_inc_vat: 10, valid_from: '2025-03-13T00:00:00Z' },
      { foo: 'bar' },
      { value_inc_vat: 20 }, // missing timestamp
      null,
    ];
    expect(mapAgilePrices(raw)).toHaveLength(1);
  });

  it('returns empty array for null / undefined / object without results', () => {
    expect(mapAgilePrices(null)).toEqual([]);
    expect(mapAgilePrices(undefined)).toEqual([]);
    expect(mapAgilePrices({ data: [] })).toEqual([]);
  });

  it('recognises alternative field names', () => {
    const raw = [{ price: 15, timestamp: '2025-06-01T12:00:00Z' }];
    const prices = mapAgilePrices(raw);
    expect(prices).toHaveLength(1);
    expect(prices[0].price).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// mapFlexEvents
// ---------------------------------------------------------------------------

describe('mapFlexEvents', () => {
  const dayStart = Date.UTC(2025, 2, 13, 0, 0); // 2025-03-13 00:00 UTC
  const dayEnd = Date.UTC(2025, 2, 13, 23, 30);  // 2025-03-13 23:30 UTC

  it('expands time-only events to each day in the range', () => {
    const raw = {
      flexibility_opportunities: [
        { event_type: 'demand_turn_down', start_time: '18:00', end_time: '19:30' },
      ],
    };

    const twoDayEnd = Date.UTC(2025, 2, 14, 23, 30);
    const events = mapFlexEvents(raw, dayStart, twoDayEnd);

    expect(events.length).toBe(2); // one per day
    expect(events[0].label).toBe('demand turn down');
  });

  it('formats labels by replacing underscores with spaces', () => {
    const raw = [{ event_type: 'demand_turn_up', start_time: '02:00', end_time: '04:00' }];
    const events = mapFlexEvents(raw, dayStart, dayEnd);
    expect(events[0].label).toBe('demand turn up');
  });

  it('handles full ISO timestamp events', () => {
    const raw = [{
      start: '2025-03-13T10:00:00Z',
      end: '2025-03-13T12:00:00Z',
    }];
    const events = mapFlexEvents(raw, dayStart, dayEnd);
    expect(events).toHaveLength(1);
    expect(events[0].startTs).toBe(Date.UTC(2025, 2, 13, 10, 0));
    expect(events[0].endTs).toBe(Date.UTC(2025, 2, 13, 12, 0));
  });

  it('returns empty array for invalid input', () => {
    expect(mapFlexEvents(null, dayStart, dayEnd)).toEqual([]);
    expect(mapFlexEvents({ events: [] }, dayStart, dayEnd)).toEqual([]);
  });

  it('returns sorted events', () => {
    const raw = [
      { start_time: '18:00', end_time: '19:00' },
      { start_time: '02:00', end_time: '04:00' },
    ];
    const events = mapFlexEvents(raw, dayStart, dayEnd);
    expect(events[0].startTs).toBeLessThan(events[1].startTs);
  });

  it('parses optional pricing and flexibility fields', () => {
    const raw = [{
      start_time: '18:00',
      end_time: '19:30',
      event_type: 'demand_turn_down',
      price_per_kWh: 1.5,
      min_flexibility_kWh: 0.5,
      max_flexibility_kWh: 3.0,
    }];
    const events = mapFlexEvents(raw, dayStart, dayEnd);
    expect(events).toHaveLength(1);
    expect(events[0].pricePerKwh).toBe(1.5);
    expect(events[0].minFlexKwh).toBe(0.5);
    expect(events[0].maxFlexKwh).toBe(3.0);
  });

  it('leaves new fields undefined when not present in raw data', () => {
    const raw = [{ start_time: '18:00', end_time: '19:30' }];
    const events = mapFlexEvents(raw, dayStart, dayEnd);
    expect(events[0].pricePerKwh).toBeUndefined();
    expect(events[0].minFlexKwh).toBeUndefined();
    expect(events[0].maxFlexKwh).toBeUndefined();
  });

  it('assigns a category derived from the label at intake', () => {
    const raw = [
      { event_type: 'demand_turn_down', start_time: '18:00', end_time: '19:30' },
      { event_type: 'demand_turn_up', start_time: '02:00', end_time: '04:00' },
      { start_time: '10:00', end_time: '11:00' },
    ];
    const events = mapFlexEvents(raw, dayStart, dayEnd);
    const category = Object.fromEntries(events.map((e) => [e.label ?? 'none', e.category]));
    expect(category['demand turn down']).toBe('use-less');
    expect(category['demand turn up']).toBe('use-more');
    expect(category['none']).toBe('other');
  });
});

// ---------------------------------------------------------------------------
// classifyFlexEvent
//
// The use-less / use-more / other meaning of a flex event is a domain fact,
// resolved once at intake instead of re-derived by the card UI matching the
// free-text label.
// ---------------------------------------------------------------------------

describe('classifyFlexEvent', () => {
  it('classifies turn-down / reduce labels as use-less', () => {
    expect(classifyFlexEvent('demand turn down')).toBe('use-less');
    expect(classifyFlexEvent('Reduce your usage')).toBe('use-less');
  });

  it('classifies turn-up / increase labels as use-more', () => {
    expect(classifyFlexEvent('demand turn up')).toBe('use-more');
    expect(classifyFlexEvent('Increase demand')).toBe('use-more');
  });

  it('classifies unknown or missing labels as other', () => {
    expect(classifyFlexEvent('grid balancing')).toBe('other');
    expect(classifyFlexEvent(undefined)).toBe('other');
  });
});

// ---------------------------------------------------------------------------
// parseHouseholdUsageCsv
// ---------------------------------------------------------------------------

describe('parseHouseholdUsageCsv', () => {
  const refDay = new UTCDate(Date.UTC(2025, 2, 13));

  it('parses valid CSV rows', () => {
    const csv = [
      'Time,Standard_Household,HeatPump_Household,HeatPump_Battery_Household',
      '00:00,0.4,0.6,0.6',
      '00:30,0.3,0.5,0.5',
    ].join('\n');

    const rows = parseHouseholdUsageCsv(csv, refDay);
    expect(rows).toHaveLength(2);
    expect(rows[0].standard).toBe(0.4);
    expect(rows[0].heatPump).toBe(0.6);
    expect(rows[0].heatPumpBattery).toBe(0.6);
  });

  it('anchors times to the reference date', () => {
    const csv = [
      'Time,Standard_Household,HeatPump_Household,HeatPump_Battery_Household',
      '14:30,1.0,1.0,1.0',
    ].join('\n');

    const rows = parseHouseholdUsageCsv(csv, refDay);
    expect(rows[0].ts).toBe(Date.UTC(2025, 2, 13, 14, 30));
  });

  it('skips rows with missing numeric columns', () => {
    const csv = [
      'Time,Standard_Household,HeatPump_Household,HeatPump_Battery_Household',
      '00:00,0.4,,0.6',
      '00:30,0.3,0.5,0.5',
    ].join('\n');

    const rows = parseHouseholdUsageCsv(csv, refDay);
    expect(rows).toHaveLength(1);
  });

  it('returns empty array for empty CSV', () => {
    expect(parseHouseholdUsageCsv('', refDay)).toEqual([]);
  });

  it('returns sorted rows', () => {
    const csv = [
      'Time,Standard_Household,HeatPump_Household,HeatPump_Battery_Household',
      '12:00,1,1,1',
      '06:00,1,1,1',
    ].join('\n');

    const rows = parseHouseholdUsageCsv(csv, refDay);
    expect(rows[0].ts).toBeLessThan(rows[1].ts);
  });
});

// ---------------------------------------------------------------------------
// resolveUsageAnchor
//
// Regression: the Shift Simulator reported "No difference" for every shift
// whenever the usage day fell outside the price range, because lookupPrice
// then returns a flat edge price for every slot. The anchor must always land
// on a day the price feed covers so usage maps to real, varying prices.
// ---------------------------------------------------------------------------

describe('resolveUsageAnchor', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  /** Build a contiguous run of half-hourly prices starting at `startTs`. */
  const priceRun = (startTs: number, count: number): PricePoint[] =>
    Array.from({ length: count }, (_, i) => ({
      ts: startTs + i * HALF_HOUR_MS,
      // Vary by slot so a flat fallback is detectable: 10p..40p sawtooth.
      price: 10 + ((i * 7) % 31),
    }));

  /** True when all 48 slots of `dayStart` lie within the price range. */
  const fullyCovered = (prices: PricePoint[], dayStart: number): boolean =>
    dayStart >= prices[0].ts &&
    dayStart + 47 * HALF_HOUR_MS <= prices[prices.length - 1].ts;

  it('anchors to today when the feed fully covers today', () => {
    const today = Date.UTC(2026, 4, 31);
    const now = new Date(Date.UTC(2026, 4, 31, 12, 0)); // midday
    // Yesterday + today, both complete (96 slots).
    const prices = priceRun(today - DAY_MS, 96);

    const anchor = resolveUsageAnchor(prices, now);
    expect(anchor.getTime()).toBe(today);
    expect(fullyCovered(prices, anchor.getTime())).toBe(true);
  });

  it('falls back to the most recent complete day when today is only partial', () => {
    // Mirrors the live feed: yesterday full, today only published to 21:30.
    const today = Date.UTC(2026, 4, 31);
    const now = new Date(Date.UTC(2026, 4, 31, 22, 0));
    const prices = priceRun(today - DAY_MS, 48 + 44); // 48 + slots 00:00..21:30

    const anchor = resolveUsageAnchor(prices, now);
    expect(anchor.getTime()).toBe(today - DAY_MS); // yesterday, fully covered
    expect(fullyCovered(prices, anchor.getTime())).toBe(true);
  });

  it('never anchors to a day the feed cannot cover (e.g. retired product)', () => {
    // Prices are weeks stale relative to `now` — the deprecation scenario.
    const now = new Date(Date.UTC(2026, 4, 31, 12, 0));
    const stale = Date.UTC(2026, 4, 1);
    const prices = priceRun(stale, 96); // two complete stale days

    const anchor = resolveUsageAnchor(prices, now);
    expect(anchor.getTime()).toBeLessThan(Date.UTC(2026, 4, 31));
    expect(fullyCovered(prices, anchor.getTime())).toBe(true);
  });

  it('returns today and does not throw for an empty feed', () => {
    const now = new Date(Date.UTC(2026, 4, 31, 9, 30));
    expect(resolveUsageAnchor([], now).getTime()).toBe(Date.UTC(2026, 4, 31));
  });

  it('falls back to the first price day when the feed is under a day long', () => {
    const now = new Date(Date.UTC(2026, 4, 31, 12, 0));
    const start = Date.UTC(2026, 4, 30, 6, 0); // 6am, only 10 slots
    const prices = priceRun(start, 10);

    const anchor = resolveUsageAnchor(prices, now);
    expect(anchor.getTime()).toBe(Date.UTC(2026, 4, 30)); // start-of-day of feed
  });

  it('keeps the Shift Simulator non-flat when the feed lags the clock', () => {
    // End-to-end regression for the reported bug: clock says today, but the
    // feed only covers yesterday. After anchoring, an expensive→cheap shift
    // must produce a real saving — not "No difference".
    const today = Date.UTC(2026, 4, 31);
    const now = new Date(today + 12 * 60 * 60 * 1000);
    const prices = priceRun(today - DAY_MS, 48); // yesterday only

    const anchor = resolveUsageAnchor(prices, now);
    const csv = [
      'Time,Standard_Household,HeatPump_Household,HeatPump_Battery_Household',
      '02:00,2,2,2', // slot 4 — priced 38p in the sawtooth
      '00:30,1,1,1', // slot 1 — priced 17p
    ].join('\n');
    const usage = parseHouseholdUsageCsv(csv, anchor);

    const expensive = [anchor.getTime() + 4 * HALF_HOUR_MS];
    const cheap = [anchor.getTime() + 1 * HALF_HOUR_MS];
    const result = simulateShift(usage, prices, 'standard', expensive, cheap, 2);

    expect(result.savingPence).toBeGreaterThan(0); // would be 0 before the fix
  });
});
