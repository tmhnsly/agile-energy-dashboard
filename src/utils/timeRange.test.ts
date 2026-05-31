import { describe, it, expect } from 'vitest';
import type { TimeRange } from '@/types/energy';
import { rangeIndices, windowOverlapsRange } from './timeRange';

const pts = (...ts: number[]) => ts.map((t) => ({ ts: t }));

// ---------------------------------------------------------------------------
// rangeIndices — the half-open index window [start, end) covering the
// half-open TimeRange [fromTs, toTs). A slot whose ts === toTs is EXCLUDED,
// so a length-(N·step) range always contains exactly N slot-starts regardless
// of sub-step offset. Owns the half-open-range contract.
// ---------------------------------------------------------------------------

describe('rangeIndices', () => {
  const arr = pts(0, 10, 20, 30, 40);

  it('includes fromTs but excludes a slot sitting exactly at toTs', () => {
    const { start, end } = rangeIndices(arr, { fromTs: 10, toTs: 30 });
    expect(start).toBe(1); // ts=10 included
    expect(end).toBe(3); // ts=30 excluded — end is exclusive index
    expect(arr.slice(start, end).map((p) => p.ts)).toEqual([10, 20]);
  });

  it('includes a slot at toTs only when toTs is past it', () => {
    const { start, end } = rangeIndices(arr, { fromTs: 10, toTs: 31 });
    expect(arr.slice(start, end).map((p) => p.ts)).toEqual([10, 20, 30]);
  });

  it('covers the whole array when the range spans past the last element', () => {
    expect(rangeIndices(arr, { fromTs: -5, toTs: 100 })).toEqual({ start: 0, end: 5 });
  });

  it('counts a fixed number of slots regardless of sub-step offset', () => {
    // A width-20 half-open range over step-10 data always spans 2 slot-starts.
    for (const offset of [0, 1, 5, 9]) {
      const { start, end } = rangeIndices(arr, { fromTs: offset, toTs: offset + 20 });
      expect(end - start).toBe(2);
    }
  });

  it('returns an empty window when the range is entirely before the data', () => {
    const { start, end } = rangeIndices(arr, { fromTs: -100, toTs: -1 });
    expect(start).toBe(end); // empty
  });

  it('returns an empty window when the range is entirely after the data', () => {
    const { start, end } = rangeIndices(arr, { fromTs: 50, toTs: 60 });
    expect(start).toBe(end);
  });

  it('returns an empty window for a zero-width range', () => {
    const { start, end } = rangeIndices(arr, { fromTs: 20, toTs: 20 });
    expect(start).toBe(end); // [20, 20) contains no slot
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
