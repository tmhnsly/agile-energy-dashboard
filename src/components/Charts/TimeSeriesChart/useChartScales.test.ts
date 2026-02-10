import { describe, it, expect } from 'vitest';
import type { ChartSeries } from '@/types/chart';
import { computeYDomain, computeAutoLeftMargin } from './useChartScales';

/* ── computeYDomain ───────────────────────────────── */

describe('computeYDomain', () => {
  it('returns [0, 100] for empty series', () => {
    expect(computeYDomain([])).toEqual([0, 100]);
  });

  it('returns [0, 100] for series with no data', () => {
    const series: ChartSeries[] = [{ id: 'a', label: 'A', data: [] }];
    expect(computeYDomain(series)).toEqual([0, 100]);
  });

  it('applies 10% padding', () => {
    const series: ChartSeries[] = [{
      id: 'a',
      label: 'A',
      data: [
        { ts: 0, value: 0 },
        { ts: 1, value: 100 },
      ],
    }];
    const [lo, hi] = computeYDomain(series);
    // range = 100, pad = 10
    expect(lo).toBe(-10);
    expect(hi).toBe(110);
  });

  it('uses pad=5 fallback for flat data', () => {
    const series: ChartSeries[] = [{
      id: 'a',
      label: 'A',
      data: [
        { ts: 0, value: 50 },
        { ts: 1, value: 50 },
      ],
    }];
    const [lo, hi] = computeYDomain(series);
    expect(lo).toBe(45);
    expect(hi).toBe(55);
  });

  it('finds global min/max across multiple series', () => {
    const series: ChartSeries[] = [
      { id: 'a', label: 'A', data: [{ ts: 0, value: 10 }, { ts: 1, value: 20 }] },
      { id: 'b', label: 'B', data: [{ ts: 0, value: 5 }, { ts: 1, value: 30 }] },
    ];
    const [lo, hi] = computeYDomain(series);
    // range = 25, pad = 2.5
    expect(lo).toBe(5 - 2.5);
    expect(hi).toBe(30 + 2.5);
  });
});

/* ── computeAutoLeftMargin ────────────────────────── */

describe('computeAutoLeftMargin', () => {
  it('returns a positive number for a typical domain', () => {
    const margin = computeAutoLeftMargin([0, 100]);
    expect(margin).toBeGreaterThan(0);
  });

  it('returns a wider margin with custom formatter that produces longer text', () => {
    const baseMargin = computeAutoLeftMargin([0, 100]);
    const wideMargin = computeAutoLeftMargin([0, 100], (v) => `$${v.toFixed(4)}/kWh`);
    expect(wideMargin).toBeGreaterThan(baseMargin);
  });

  it('uses default formatter when none provided', () => {
    // Should not throw and should return a valid number
    const margin = computeAutoLeftMargin([0, 50]);
    expect(typeof margin).toBe('number');
    expect(margin).toBeGreaterThan(0);
  });
});
