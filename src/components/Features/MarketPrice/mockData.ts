import { HALF_HOUR_MS } from '@/utils/constants';
import type { FlexEvent } from '@/types/energy';
import { BASE_DATE, PRICES_RAW, MOCK_PRICES } from '@/test/fixtures/marketData';

export const mockPrices = MOCK_PRICES;

export const mockFlexEvents: FlexEvent[] = [
  {
    id: 'flex-0',
    startTs: BASE_DATE + 4 * HALF_HOUR_MS,  // 02:00
    endTs: BASE_DATE + 8 * HALF_HOUR_MS,    // 04:00
    label: 'demand turn up',
  },
  {
    id: 'flex-1',
    startTs: BASE_DATE + 36 * HALF_HOUR_MS, // 18:00
    endTs: BASE_DATE + 39 * HALF_HOUR_MS,   // 19:30
    label: 'demand turn down',
  },
];

export const mockRange = {
  fromTs: mockPrices[0].ts,
  toTs: mockPrices[mockPrices.length - 1].ts,
};

export const mockStats = {
  min: { price: 17.7, ts: BASE_DATE + 5 * HALF_HOUR_MS },
  max: { price: 44.5, ts: BASE_DATE + 36 * HALF_HOUR_MS },
  total: PRICES_RAW.reduce((s, v) => s + v, 0),
  count: PRICES_RAW.length,
};
