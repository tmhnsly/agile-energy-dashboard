import { HALF_HOUR_MS } from '@/utils/constants';
import type { PricePoint } from '@/types/energy';

/** Shared base date used across all mock data files. */
export const BASE_DATE = new Date('2025-03-12T00:00:00Z').getTime();

/** 48 half-hourly agile tariff prices (p/kWh). */
export const PRICES_RAW = [
  20.5, 19.8, 19.2, 18.9, 18.6, 17.7, 19.5, 19.8, 20.2, 21.2, 22.4, 23.6,
  24.8, 26.0, 24.4, 24.7, 21.9, 19.4, 19.6, 20.3, 20.0, 21.0, 20.5, 19.5,
  20.1, 19.5, 20.1, 20.2, 20.4, 20.2, 20.1, 20.3, 30.8, 33.5, 38.4, 42.1,
  44.5, 44.5, 28.8, 27.4, 26.2, 24.2, 23.4, 21.6, 20.0, 22.5, 21.8, 20.6,
];

/** Price points derived from PRICES_RAW, aligned to BASE_DATE. */
export const MOCK_PRICES: PricePoint[] = PRICES_RAW.map((price, i) => ({
  ts: BASE_DATE + i * HALF_HOUR_MS,
  price,
}));
