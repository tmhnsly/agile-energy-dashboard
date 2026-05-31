import { describe, it, expect } from 'vitest';
import { computeFullRange, isValidRange } from './useTimeRange';

const BASE = Date.UTC(2025, 2, 12, 0, 0);

// computeFullRange returns a half-open extent [fromTs, toTs): the end is the
// END of the last bucket (last.ts + bucketMs), so the final slot is still
// counted under half-open slicing and the duration reflects real wall-clock.
describe('computeFullRange', () => {
  it('pads toTs by an explicit bucket so the last slot is covered', () => {
    const items = [{ ts: BASE }, { ts: BASE + 1000 }, { ts: BASE + 3000 }];
    expect(computeFullRange(items, 1000)).toEqual({ fromTs: BASE, toTs: BASE + 4000 });
  });

  it('infers the bucket from the first gap when not given', () => {
    const items = [{ ts: BASE }, { ts: BASE + 500 }, { ts: BASE + 1000 }];
    // gap = 500, so toTs = last (BASE + 1000) + 500
    expect(computeFullRange(items)).toEqual({ fromTs: BASE, toTs: BASE + 1500 });
  });

  it('returns zero range for empty array', () => {
    expect(computeFullRange([])).toEqual({ fromTs: 0, toTs: 0 });
  });

  it('pads a single item by the given bucket', () => {
    expect(computeFullRange([{ ts: BASE }], 500)).toEqual({ fromTs: BASE, toTs: BASE + 500 });
  });

  it('leaves a single item unpadded when no bucket can be inferred', () => {
    expect(computeFullRange([{ ts: BASE }])).toEqual({ fromTs: BASE, toTs: BASE });
  });

  it('handles two items with an explicit bucket', () => {
    const items = [{ ts: BASE }, { ts: BASE + 500 }];
    expect(computeFullRange(items, 500)).toEqual({ fromTs: BASE, toTs: BASE + 1000 });
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
