import { describe, it, expect } from 'vitest';
import { lowerBound, upperBound, bisectNearest } from './binarySearch';

const pts = [
  { ts: 10 },
  { ts: 20 },
  { ts: 30 },
  { ts: 40 },
  { ts: 50 },
];

// ---------------------------------------------------------------------------
// lowerBound — first element with ts >= target
// ---------------------------------------------------------------------------

describe('lowerBound', () => {
  it('returns 0 when target is before all elements', () => {
    expect(lowerBound(pts, 5)).toBe(0);
  });

  it('returns the index of an exact match', () => {
    expect(lowerBound(pts, 30)).toBe(2);
  });

  it('returns the next index when target falls between elements', () => {
    expect(lowerBound(pts, 25)).toBe(2);
  });

  it('returns arr.length when target is past all elements', () => {
    expect(lowerBound(pts, 100)).toBe(5);
  });

  it('returns 0 for an empty array', () => {
    expect(lowerBound([], 10)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// upperBound — index past the last element with ts <= target
// ---------------------------------------------------------------------------

describe('upperBound', () => {
  it('returns 0 when target is before all elements', () => {
    expect(upperBound(pts, 5)).toBe(0);
  });

  it('returns one past the exact match', () => {
    expect(upperBound(pts, 30)).toBe(3);
  });

  it('returns the correct index when target falls between elements', () => {
    expect(upperBound(pts, 25)).toBe(2);
  });

  it('returns arr.length when target is past all elements', () => {
    expect(upperBound(pts, 100)).toBe(5);
  });

  it('returns 0 for an empty array', () => {
    expect(upperBound([], 10)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// bisectNearest — index of the closest element to target
// ---------------------------------------------------------------------------

describe('bisectNearest', () => {
  it('returns -1 for an empty array', () => {
    expect(bisectNearest([], 10)).toBe(-1);
  });

  it('returns 0 when target is before all elements', () => {
    expect(bisectNearest(pts, 1)).toBe(0);
  });

  it('returns the last index when target is past all elements', () => {
    expect(bisectNearest(pts, 999)).toBe(4);
  });

  it('returns exact match index', () => {
    expect(bisectNearest(pts, 30)).toBe(2);
  });

  it('returns the closer of two neighbours (closer to lower)', () => {
    expect(bisectNearest(pts, 22)).toBe(1); // closer to 20 than 30
  });

  it('returns the closer of two neighbours (closer to upper)', () => {
    expect(bisectNearest(pts, 28)).toBe(2); // closer to 30 than 20
  });

  it('returns the lower index when equidistant', () => {
    expect(bisectNearest(pts, 25)).toBe(1); // equidistant — prefers lower
  });

  it('works with a single element', () => {
    expect(bisectNearest([{ ts: 42 }], 100)).toBe(0);
  });
});
