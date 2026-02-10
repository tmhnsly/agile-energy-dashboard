import { describe, it, expect } from 'vitest';
import { computeDragRange, handleBandClick } from './useChartInteraction';
import type { ChartRange, ChartBandHitArea } from './useChartInteraction';

/* ── helpers ──────────────────────────────────────── */

const fullRange: ChartRange = { from: 0, to: 1000 };

function drag(
  type: 'new' | 'left' | 'right' | 'region',
  overrides: Partial<{
    originValue: number;
    startFrom: number;
    startTo: number;
  }> = {},
) {
  return {
    type,
    originX: 0,
    originValue: overrides.originValue ?? 200,
    startFrom: overrides.startFrom ?? 200,
    startTo: overrides.startTo ?? 600,
  };
}

/* ── computeDragRange ─────────────────────────────── */

describe('computeDragRange', () => {
  describe('new drag', () => {
    it('creates range between origin and current value', () => {
      const result = computeDragRange(
        drag('new', { originValue: 300 }),
        500,
        fullRange,
        0,
      );
      expect(result).toEqual({ from: 300, to: 500 });
    });

    it('handles current < origin (dragging left)', () => {
      const result = computeDragRange(
        drag('new', { originValue: 500 }),
        300,
        fullRange,
        0,
      );
      expect(result).toEqual({ from: 300, to: 500 });
    });

    it('clamps to fullRange.from', () => {
      const result = computeDragRange(
        drag('new', { originValue: 200 }),
        -100,
        fullRange,
        0,
      );
      expect(result.from).toBe(0);
    });

    it('clamps to fullRange.to', () => {
      const result = computeDragRange(
        drag('new', { originValue: 200 }),
        1500,
        fullRange,
        0,
      );
      expect(result.to).toBe(1000);
    });
  });

  describe('left resize', () => {
    it('moves from edge by delta', () => {
      const d = drag('left', { originValue: 200, startFrom: 200, startTo: 600 });
      const result = computeDragRange(d, 300, fullRange, 0);
      expect(result).toEqual({ from: 300, to: 600 });
    });

    it('clamps from to fullRange.from', () => {
      const d = drag('left', { originValue: 200, startFrom: 200, startTo: 600 });
      const result = computeDragRange(d, -100, fullRange, 0);
      expect(result.from).toBe(0);
    });

    it('enforces minSpan', () => {
      const d = drag('left', { originValue: 200, startFrom: 200, startTo: 600 });
      // try to move from to 590 → should clamp to 600-100=500
      const result = computeDragRange(d, 590, fullRange, 100);
      expect(result.from).toBe(500);
      expect(result.to).toBe(600);
    });
  });

  describe('right resize', () => {
    it('moves to edge by delta', () => {
      const d = drag('right', { originValue: 600, startFrom: 200, startTo: 600 });
      const result = computeDragRange(d, 800, fullRange, 0);
      expect(result).toEqual({ from: 200, to: 800 });
    });

    it('clamps to fullRange.to', () => {
      const d = drag('right', { originValue: 600, startFrom: 200, startTo: 600 });
      const result = computeDragRange(d, 1500, fullRange, 0);
      expect(result.to).toBe(1000);
    });

    it('enforces minSpan', () => {
      const d = drag('right', { originValue: 600, startFrom: 200, startTo: 600 });
      // try to move to 250 → should clamp to 200+100=300
      const result = computeDragRange(d, 250, fullRange, 100);
      expect(result.to).toBe(300);
      expect(result.from).toBe(200);
    });
  });

  describe('region pan', () => {
    it('pans both edges by delta', () => {
      const d = drag('region', { originValue: 400, startFrom: 200, startTo: 600 });
      const result = computeDragRange(d, 500, fullRange, 0);
      expect(result).toEqual({ from: 300, to: 700 });
    });

    it('clamps when pushed past left edge', () => {
      const d = drag('region', { originValue: 400, startFrom: 200, startTo: 600 });
      const result = computeDragRange(d, 0, fullRange, 0);
      expect(result).toEqual({ from: 0, to: 400 });
    });

    it('clamps when pushed past right edge', () => {
      const d = drag('region', { originValue: 400, startFrom: 200, startTo: 600 });
      const result = computeDragRange(d, 900, fullRange, 0);
      expect(result).toEqual({ from: 600, to: 1000 });
    });
  });
});

/* ── handleBandClick ──────────────────────────────── */

describe('handleBandClick', () => {
  const bands: ChartBandHitArea[] = [
    { id: 'wide', from: 100, to: 900 },
    { id: 'narrow', from: 300, to: 500 },
  ];

  it('returns null for empty bands', () => {
    expect(handleBandClick(400, [])).toBeNull();
  });

  it('returns null when click is outside all bands', () => {
    expect(handleBandClick(50, bands)).toBeNull();
  });

  it('returns the band range for a single hit', () => {
    const singleBand: ChartBandHitArea[] = [{ id: 'a', from: 100, to: 200 }];
    expect(handleBandClick(150, singleBand)).toEqual({ from: 100, to: 200 });
  });

  it('picks the narrowest band when multiple overlap', () => {
    const result = handleBandClick(400, bands);
    expect(result).toEqual({ from: 300, to: 500 });
  });

  it('matches at exact boundary (inclusive)', () => {
    expect(handleBandClick(100, bands)).not.toBeNull();
    expect(handleBandClick(900, bands)).not.toBeNull();
  });
});
