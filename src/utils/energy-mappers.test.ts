import { describe, it, expect } from 'vitest';
import { UTCDate } from '@date-fns/utc';
import {
  mapAgilePrices,
  mapFlexEvents,
  parseHouseholdUsageCsv,
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
