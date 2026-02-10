/**
 * Binary-search helpers for timestamp-sorted arrays.
 *
 * All functions expect `arr` sorted ascending by `ts`. O(log n).
 * Used to efficiently slice data for a visible time range.
 */

/**
 * Index of the first element with `ts >= target`.
 * Returns `arr.length` if every element is before `target`.
 */
export function lowerBound(arr: { ts: number }[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid].ts < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Index past the last element with `ts <= target`.
 * Returns `0` if every element is after `target`.
 *
 * Use with `lowerBound` to get a half-open `[start, end)` slice.
 */
export function upperBound(arr: { ts: number }[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid].ts <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Index of the element whose `ts` is closest to `target`.
 * Returns `-1` for an empty array.
 *
 * Used by the chart tooltip to snap to the nearest data point.
 */
export function bisectNearest(arr: { ts: number }[], target: number): number {
  if (arr.length === 0) return -1;
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid].ts < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo === 0) return 0;
  if (lo === arr.length) return arr.length - 1;
  return target - arr[lo - 1].ts <= arr[lo].ts - target ? lo - 1 : lo;
}
