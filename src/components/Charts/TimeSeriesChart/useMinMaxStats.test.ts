import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { ChartDataPoint } from '@/types/chart';
import type { TimeRange } from '@/types/energy';
import { computeMinMax } from './useMinMaxStats';

const BASE = Date.UTC(2025, 2, 12, 0, 0);

/*
 * Four half-hourly data points (indices 0–3):
 *
 *   Slot 0: BASE          → 5
 *   Slot 1: BASE + 30 min → 10
 *   Slot 2: BASE + 60 min → 2
 *   Slot 3: BASE + 90 min → 8
 */
const data: ChartDataPoint[] = [
  { ts: BASE, value: 5 },
  { ts: BASE + HALF_HOUR_MS, value: 10 },
  { ts: BASE + 2 * HALF_HOUR_MS, value: 2 },
  { ts: BASE + 3 * HALF_HOUR_MS, value: 8 },
];

// ── Range semantics ──────────────────────────────────────────────────
// Ranges are inclusive on both ends: [fromTs, toTs].
// ─────────────────────────────────────────────────────────────────────

describe('computeMinMax', () => {
  it('finds min and max over full data extent', () => {
    const range: TimeRange = { fromTs: data[0].ts, toTs: data[3].ts };
    const result = computeMinMax(data, range, true);

    expect(result.min).toEqual({ ts: data[2].ts, value: 2 });
    expect(result.max).toEqual({ ts: data[1].ts, value: 10 });
  });

  it('returns nulls when showMinMaxMarkers is false', () => {
    const range: TimeRange = { fromTs: data[0].ts, toTs: data[3].ts };
    const result = computeMinMax(data, range, false);

    expect(result).toEqual({ min: null, max: null });
  });

  it('returns nulls for empty range', () => {
    const emptyRange: TimeRange = { fromTs: BASE + 100 * HALF_HOUR_MS, toTs: BASE + 200 * HALF_HOUR_MS };
    const result = computeMinMax(data, emptyRange, true);

    expect(result).toEqual({ min: null, max: null });
  });

  it('handles single point (both min and max)', () => {
    const single: ChartDataPoint[] = [{ ts: BASE, value: 7 }];
    const range: TimeRange = { fromTs: single[0].ts, toTs: single[0].ts };
    const result = computeMinMax(single, range, true);

    expect(result.min).toEqual({ ts: BASE, value: 7 });
    expect(result.max).toEqual({ ts: BASE, value: 7 });
  });

  it('includes both endpoints of a sub-range', () => {
    // Range covers slots 1–2; slot 0 and slot 3 should be excluded
    const subRange: TimeRange = { fromTs: data[1].ts, toTs: data[2].ts };
    const result = computeMinMax(data, subRange, true);

    expect(result.min).toEqual({ ts: data[2].ts, value: 2 });
    expect(result.max).toEqual({ ts: data[1].ts, value: 10 });
  });

  it('returns nulls for empty data array', () => {
    const range: TimeRange = { fromTs: data[0].ts, toTs: data[3].ts };
    const result = computeMinMax([], range, true);

    expect(result).toEqual({ min: null, max: null });
  });
});
