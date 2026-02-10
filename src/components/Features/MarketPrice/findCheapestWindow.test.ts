import { describe, it, expect } from 'vitest';
import { findCheapestWindow } from './findCheapestWindow';

const HH = 30 * 60_000; // half-hour in ms

/** Build n contiguous half-hourly data points starting at `startTs`. */
function makeData(startTs: number, values: number[]) {
  return values.map((value, i) => ({ ts: startTs + i * HH, value }));
}

const T0 = Date.UTC(2025, 2, 13, 0, 0); // 2025-03-13 00:00 UTC

describe('findCheapestWindow', () => {
  it('finds the cheapest 3h window in 6h of data', () => {
    // 12 half-hours, cheapest 6-slot window should be the run of 1s
    const data = makeData(T0, [10, 10, 10, 1, 1, 1, 1, 1, 1, 10, 10, 10]);
    const fullRange = { fromTs: T0, toTs: T0 + 12 * HH };

    const result = findCheapestWindow(data, fullRange, 3 * 60 * 60_000);
    expect(result).not.toBeNull();
    expect(result!.fromTs).toBe(T0 + 3 * HH);
  });

  it('returns null for empty data', () => {
    const fullRange = { fromTs: T0, toTs: T0 + 6 * HH };
    expect(findCheapestWindow([], fullRange, 3 * 60 * 60_000)).toBeNull();
  });

  it('returns fullRange when range is shorter than requested duration', () => {
    const data = makeData(T0, [5, 5, 5, 5]);
    const fullRange = { fromTs: T0, toTs: T0 + 4 * HH };
    const result = findCheapestWindow(data, fullRange, 6 * 60 * 60_000);
    expect(result).toEqual(fullRange);
  });

  it('returns null when data has fewer points than the window size', () => {
    const data = makeData(T0, [5, 5]);
    const fullRange = { fromTs: T0, toTs: T0 + 24 * HH };
    const result = findCheapestWindow(data, fullRange, 6 * 60 * 60_000);
    expect(result).toBeNull();
  });

  it('picks the first window when all values are equal', () => {
    const data = makeData(T0, [5, 5, 5, 5, 5, 5]);
    const fullRange = { fromTs: T0, toTs: T0 + 6 * HH };

    const result = findCheapestWindow(data, fullRange, 2 * 60 * 60_000);
    expect(result).not.toBeNull();
    expect(result!.fromTs).toBe(T0);
  });

  it('handles negative values — picks the most negative window', () => {
    const data = makeData(T0, [10, 10, -5, -5, -5, -5, 10, 10]);
    const fullRange = { fromTs: T0, toTs: T0 + 8 * HH };

    const result = findCheapestWindow(data, fullRange, 2 * 60 * 60_000);
    expect(result).not.toBeNull();
    expect(result!.fromTs).toBe(T0 + 2 * HH);
  });

  it('returns a range with the correct duration', () => {
    const data = makeData(T0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const fullRange = { fromTs: T0, toTs: T0 + 12 * HH };
    const duration = 3 * 60 * 60_000;

    const result = findCheapestWindow(data, fullRange, duration);
    expect(result).not.toBeNull();
    expect(result!.toTs - result!.fromTs).toBe(duration);
  });
});
