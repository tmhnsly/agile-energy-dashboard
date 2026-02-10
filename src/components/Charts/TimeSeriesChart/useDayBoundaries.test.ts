import { describe, it, expect } from 'vitest';
import { addDays, addHours } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { computeDayBoundaries } from './useDayBoundaries';

const base = new UTCDate('2025-03-12T00:00:00Z');

describe('computeDayBoundaries', () => {
  it('returns midnight timestamps for a multi-day range', () => {
    const from = addHours(base, 6).getTime();
    const to = addHours(addDays(base, 2), 18).getTime();
    const result = computeDayBoundaries({ fromTs: from, toTs: to });

    expect(result).toEqual([
      addDays(base, 1).getTime(),
      addDays(base, 2).getTime(),
    ]);
  });

  it('returns empty for an intra-day range', () => {
    const from = addHours(base, 6).getTime();
    const to = addHours(base, 18).getTime();
    const result = computeDayBoundaries({ fromTs: from, toTs: to });

    expect(result).toEqual([]);
  });

  it('returns empty for a zero-width range', () => {
    const ts = addHours(base, 12).getTime();
    const result = computeDayBoundaries({ fromTs: ts, toTs: ts });

    expect(result).toEqual([]);
  });

  it('excludes midnight when range starts at midnight', () => {
    const from = base.getTime();
    const to = addHours(addDays(base, 1), 12).getTime();
    const result = computeDayBoundaries({ fromTs: from, toTs: to });

    expect(result).toEqual([addDays(base, 1).getTime()]);
    expect(result).not.toContain(from);
  });

  it('returns one boundary for exactly 24h range', () => {
    const from = addHours(base, 6).getTime();
    const to = addHours(addDays(base, 1), 6).getTime();
    const result = computeDayBoundaries({ fromTs: from, toTs: to });

    expect(result).toEqual([addDays(base, 1).getTime()]);
  });
});
