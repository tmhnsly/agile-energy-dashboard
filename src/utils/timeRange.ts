import type { TimeRange } from '@/types/energy';
import { lowerBound, upperBound } from '@/utils/binarySearch';

/**
 * The half-open index window `[start, end)` of a ts-sorted array that covers
 * the **inclusive** `TimeRange` `[fromTs, toTs]`.
 *
 * Uses `lowerBound` for the start and `upperBound` for the end so elements
 * whose timestamp equals `fromTs` or `toTs` are both included. This is the one
 * place the inclusive-range contract lives — callers iterate `[start, end)`
 * (or `.slice(start, end)`) instead of re-deriving the bounds with raw
 * binary search and risking an off-by-one.
 */
export function rangeIndices(
  arr: { ts: number }[],
  range: TimeRange,
): { start: number; end: number } {
  return { start: lowerBound(arr, range.fromTs), end: upperBound(arr, range.toTs) };
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
