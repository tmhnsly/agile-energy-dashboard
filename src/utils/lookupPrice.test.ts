import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { PricePoint } from '@/types/energy';
import { lookupPrice } from './lookupPrice';

const BASE = Date.UTC(2025, 2, 12, 0, 0);

const prices: PricePoint[] = [
  { ts: BASE, price: 20 },
  { ts: BASE + HALF_HOUR_MS, price: 25 },
  { ts: BASE + 2 * HALF_HOUR_MS, price: 15 },
  { ts: BASE + 3 * HALF_HOUR_MS, price: 30 },
];

describe('lookupPrice', () => {
  it('returns exact match', () => {
    expect(lookupPrice(prices, BASE + HALF_HOUR_MS)).toBe(25);
  });

  it('falls back to preceding slot', () => {
    // Timestamp between slot 1 and slot 2
    expect(lookupPrice(prices, BASE + HALF_HOUR_MS + 1000)).toBe(25);
  });

  it('returns first price when timestamp is before all data', () => {
    expect(lookupPrice(prices, BASE - HALF_HOUR_MS)).toBe(20);
  });

  it('returns 0 for empty prices', () => {
    expect(lookupPrice([], BASE)).toBe(0);
  });

  it('returns last price when timestamp is after all data', () => {
    expect(lookupPrice(prices, BASE + 10 * HALF_HOUR_MS)).toBe(30);
  });
});
