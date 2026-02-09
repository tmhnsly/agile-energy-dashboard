import type { PricePoint, FlexEvent } from '@/types/energy';

/**
 * Deterministic mock data for Storybook stories.
 * Based on realistic half-hourly agile pricing over ~24h.
 */
const BASE_DATE = new Date('2025-03-12T00:00:00Z').getTime();
const HALF_HOUR = 30 * 60 * 1000;

const PRICES_RAW = [
  20.5, 19.8, 19.2, 18.9, 18.6, 17.7, 19.5, 19.8, 20.2, 21.2, 22.4, 23.6,
  24.8, 26.0, 24.4, 24.7, 21.9, 19.4, 19.6, 20.3, 20.0, 21.0, 20.5, 19.5,
  20.1, 19.5, 20.1, 20.2, 20.4, 20.2, 20.1, 20.3, 30.8, 33.5, 38.4, 42.1,
  44.5, 44.5, 28.8, 27.4, 26.2, 24.2, 23.4, 21.6, 20.0, 22.5, 21.8, 20.6,
];

export const mockPrices: PricePoint[] = PRICES_RAW.map((price, i) => ({
  ts: BASE_DATE + i * HALF_HOUR,
  price,
}));

export const mockFlexEvents: FlexEvent[] = [
  {
    id: 'flex-0',
    startTs: BASE_DATE + 4 * HALF_HOUR,  // 02:00
    endTs: BASE_DATE + 8 * HALF_HOUR,    // 04:00
    label: 'demand turn up',
  },
  {
    id: 'flex-1',
    startTs: BASE_DATE + 36 * HALF_HOUR, // 18:00
    endTs: BASE_DATE + 39 * HALF_HOUR,   // 19:30
    label: 'demand turn down',
  },
];

export const mockRange = {
  fromTs: mockPrices[0].ts,
  toTs: mockPrices[mockPrices.length - 1].ts,
};

export const mockStats = {
  min: { price: 17.7, ts: BASE_DATE + 5 * HALF_HOUR },
  max: { price: 44.5, ts: BASE_DATE + 36 * HALF_HOUR },
};
