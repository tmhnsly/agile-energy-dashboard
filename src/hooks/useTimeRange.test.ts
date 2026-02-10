import { describe, it, expect } from 'vitest';
import { computeFullRange, isValidRange } from './useTimeRange';

const BASE = Date.UTC(2025, 2, 12, 0, 0);

describe('computeFullRange', () => {
  it('returns fromTs/toTs from first and last items', () => {
    const items = [{ ts: BASE }, { ts: BASE + 1000 }, { ts: BASE + 3000 }];
    expect(computeFullRange(items)).toEqual({ fromTs: BASE, toTs: BASE + 3000 });
  });

  it('returns zero range for empty array', () => {
    expect(computeFullRange([])).toEqual({ fromTs: 0, toTs: 0 });
  });

  it('returns same fromTs/toTs for single item', () => {
    expect(computeFullRange([{ ts: BASE }])).toEqual({ fromTs: BASE, toTs: BASE });
  });

  it('handles two items', () => {
    const items = [{ ts: BASE }, { ts: BASE + 500 }];
    expect(computeFullRange(items)).toEqual({ fromTs: BASE, toTs: BASE + 500 });
  });
});

describe('isValidRange', () => {
  it('accepts a valid range', () => {
    expect(isValidRange({ fromTs: BASE, toTs: BASE + 1000 })).toBe(true);
  });

  it('rejects NaN fromTs', () => {
    expect(isValidRange({ fromTs: NaN, toTs: BASE + 1000 })).toBe(false);
  });

  it('rejects NaN toTs', () => {
    expect(isValidRange({ fromTs: BASE, toTs: NaN })).toBe(false);
  });

  it('rejects Infinity toTs', () => {
    expect(isValidRange({ fromTs: BASE, toTs: Infinity })).toBe(false);
  });

  it('rejects negative Infinity fromTs', () => {
    expect(isValidRange({ fromTs: -Infinity, toTs: BASE })).toBe(false);
  });

  it('rejects reversed range (toTs < fromTs)', () => {
    expect(isValidRange({ fromTs: BASE + 1000, toTs: BASE })).toBe(false);
  });

  it('rejects zero-width range (toTs === fromTs)', () => {
    expect(isValidRange({ fromTs: BASE, toTs: BASE })).toBe(false);
  });

  it('accepts minimal positive width', () => {
    expect(isValidRange({ fromTs: BASE, toTs: BASE + 1 })).toBe(true);
  });
});
