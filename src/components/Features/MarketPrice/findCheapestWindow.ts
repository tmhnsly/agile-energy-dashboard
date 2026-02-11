import type { TimeRange } from '@/types/energy';
import { HALF_HOUR_MS } from '@/utils/constants';

/**
 * Finds the cheapest contiguous window of `durationMs` within `fullRange`.
 *
 * Algorithm: O(n) sliding window over sorted half-hourly data.
 * - Skips windows with non-contiguous timestamps (gaps > half-hour).
 * - Returns null if data is insufficient for the requested duration.
 * - Falls back to fullRange if fullRange is shorter than durationMs.
 */
export function findCheapestWindow(
  data: ReadonlyArray<{ ts: number; value: number }>,
  fullRange: TimeRange,
  durationMs: number,
): TimeRange | null {
  if (data.length === 0) return null;

  const fullDuration = fullRange.toTs - fullRange.fromTs;
  if (fullDuration < durationMs) return { fromTs: fullRange.fromTs, toTs: fullRange.toTs };

  const windowSize = Math.round(durationMs / HALF_HOUR_MS);
  if (windowSize <= 0) return null;

  // Narrow to points within fullRange (linear scan — data is typically <200 points)
  let rangeStart = 0;
  while (rangeStart < data.length && data[rangeStart].ts < fullRange.fromTs) rangeStart++;
  let rangeEnd = data.length;
  while (rangeEnd > rangeStart && data[rangeEnd - 1].ts > fullRange.toTs) rangeEnd--;

  if (rangeEnd - rangeStart < windowSize) return null;

  // Only consider windows whose end fits within fullRange
  const maxStartTs = fullRange.toTs - durationMs;
  const expectedSpan = (windowSize - 1) * HALF_HOUR_MS;
  const spanTolerance = HALF_HOUR_MS / 2;

  // Initial window sum
  let sum = 0;
  for (let i = rangeStart; i < rangeStart + windowSize; i++) sum += data[i].value;

  let bestSum = Infinity;
  let bestStart = -1;

  // Check initial window
  if (
    data[rangeStart].ts <= maxStartTs &&
    Math.abs((data[rangeStart + windowSize - 1].ts - data[rangeStart].ts) - expectedSpan) < spanTolerance
  ) {
    bestSum = sum;
    bestStart = rangeStart;
  }

  // Slide
  for (let i = rangeStart + 1; i <= rangeEnd - windowSize; i++) {
    sum += data[i + windowSize - 1].value - data[i - 1].value;

    if (data[i].ts > maxStartTs) break;

    if (sum < bestSum) {
      const span = data[i + windowSize - 1].ts - data[i].ts;
      if (Math.abs(span - expectedSpan) < spanTolerance) {
        bestSum = sum;
        bestStart = i;
      }
    }
  }

  if (bestStart < 0) return null;

  return {
    fromTs: data[bestStart].ts,
    toTs: data[bestStart].ts + durationMs,
  };
}
