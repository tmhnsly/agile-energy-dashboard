/**
 * Find the index of the first element with ts >= target.
 * Returns arr.length if no such element exists.
 * Assumes arr is sorted ascending by ts.
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
 * Find the index past the last element with ts <= target.
 * Returns 0 if no such element exists.
 * Assumes arr is sorted ascending by ts.
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
 * Find the index of the element closest to target by ts.
 * Returns -1 if arr is empty.
 * Assumes arr is sorted ascending by ts.
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
