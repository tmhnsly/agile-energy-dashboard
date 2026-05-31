import type { TimeRange } from '@/types/energy';
import { lowerBound } from '@/utils/binarySearch';

/**
 * The index window `[start, end)` of a ts-sorted array that covers the
 * **half-open** `TimeRange` `[fromTs, toTs)`.
 *
 * Uses `lowerBound` for both bounds, so an element whose timestamp equals
 * `fromTs` is included while one equal to `toTs` is excluded. This makes a
 * range of width `N · step` cover exactly `N` slot-starts regardless of where
 * it begins — the property that keeps a fixed-duration window (e.g. the
 * cheapest 6h) counting the same number of slots no matter the sub-step
 * offset. This is the one place the half-open-range contract lives — callers
 * iterate `[start, end)` (or `.slice(start, end)`) instead of re-deriving the
 * bounds with raw binary search and risking an off-by-one.
 */
export function rangeIndices(
  arr: { ts: number }[],
  range: TimeRange,
): { start: number; end: number } {
  return { start: lowerBound(arr, range.fromTs), end: lowerBound(arr, range.toTs) };
}

/**
 * Whether a half-open window `[startTs, endTs)` overlaps the inclusive span
 * `range`. The window's end is **exclusive** — this matches `FlexEvent` /
 * `ChartBand` semantics, distinct from the inclusive `TimeRange`. A window
 * ending exactly at `range.fromTs` does not overlap; one starting exactly at
 * `range.toTs` does.
 */
export function windowOverlapsRange(
  window: { startTs: number; endTs: number },
  range: TimeRange,
): boolean {
  return window.startTs <= range.toTs && window.endTs > range.fromTs;
}
