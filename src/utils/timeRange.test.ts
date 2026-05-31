import { describe, it, expect } from 'vitest';
import type { TimeRange } from '@/types/energy';
import { rangeIndices, windowOverlapsRange } from './timeRange';

const pts = (...ts: number[]) => ts.map((t) => ({ ts: t }));

// ---------------------------------------------------------------------------
// rangeIndices — the half-open index window [start, end) covering an
// INCLUSIVE TimeRange [fromTs, toTs]. Owns the inclusive-range contract.
// ---------------------------------------------------------------------------

describe('rangeIndices', () => {
  const arr = pts(0, 10, 20, 30, 40);

  it('includes elements equal to fromTs and toTs (inclusive both ends)', () => {
    const { start, end } = rangeIndices(arr, { fromTs: 10, toTs: 30 });
    expect(start).toBe(1); // ts=10 included
    expect(end).toBe(4); // ts=30 included, end is exclusive index
    expect(arr.slice(start, end).map((p) => p.ts)).toEqual([10, 20, 30]);
  });

  it('covers the whole array when the range spans it', () => {
    expect(rangeIndices(arr, { fromTs: -5, toTs: 100 })).toEqual({ start: 0, end: 5 });
  });

  it('returns an empty window when the range is entirely before the data', () => {
    const { start, end } = rangeIndices(arr, { fromTs: -100, toTs: -1 });
    expect(start).toBe(end); // empty
  });

  it('returns an empty window when the range is entirely after the data', () => {
    const { start, end } = rangeIndices(arr, { fromTs: 50, toTs: 60 });
    expect(start).toBe(end);
  });
});

// ---------------------------------------------------------------------------
// windowOverlapsRange — half-open window [startTs, endTs) (FlexEvent /
// ChartBand semantics) vs an inclusive span. End is exclusive.
// ---------------------------------------------------------------------------

describe('windowOverlapsRange', () => {
  const span: TimeRange = { fromTs: 100, toTs: 200 };

  it('overlaps when the window sits inside the span', () => {
    expect(windowOverlapsRange({ startTs: 120, endTs: 150 }, span)).toBe(true);
  });

  it('does NOT overlap a window ending exactly at fromTs (end is exclusive)', () => {
    expect(windowOverlapsRange({ startTs: 50, endTs: 100 }, span)).toBe(false);
  });

  it('overlaps a window starting exactly at toTs (start is inclusive)', () => {
    expect(windowOverlapsRange({ startTs: 200, endTs: 260 }, span)).toBe(true);
  });

  it('does not overlap windows entirely before or after the span', () => {
    expect(windowOverlapsRange({ startTs: 0, endTs: 50 }, span)).toBe(false);
    expect(windowOverlapsRange({ startTs: 260, endTs: 300 }, span)).toBe(false);
  });
});
