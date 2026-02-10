import { HALF_HOUR_MS } from '@/utils/constants';
import type { ChartSeries, ChartBand } from '@/types/chart';

/**
 * Deterministic mock data for generic chart Storybook stories.
 * Uses the same numeric values as the price mock data, in generic shape.
 */
const BASE_DATE = new Date('2025-03-12T00:00:00Z').getTime();

const VALUES_A = [
  20.5, 19.8, 19.2, 18.9, 18.6, 17.7, 19.5, 19.8, 20.2, 21.2, 22.4, 23.6,
  24.8, 26.0, 24.4, 24.7, 21.9, 19.4, 19.6, 20.3, 20.0, 21.0, 20.5, 19.5,
  20.1, 19.5, 20.1, 20.2, 20.4, 20.2, 20.1, 20.3, 30.8, 33.5, 38.4, 42.1,
  44.5, 44.5, 28.8, 27.4, 26.2, 24.2, 23.4, 21.6, 20.0, 22.5, 21.8, 20.6,
];

export const mockSeriesA: ChartSeries = {
  id: 'series-a',
  label: 'Series A',
  data: VALUES_A.map((value, i) => ({
    ts: BASE_DATE + i * HALF_HOUR_MS,
    value,
  })),
  tone: 'accent',
};

const VALUES_B = [
  0.25, 0.22, 0.20, 0.18, 0.17, 0.16, 0.20, 0.25, 0.35, 0.45, 0.50, 0.55,
  0.60, 0.58, 0.52, 0.48, 0.42, 0.38, 0.40, 0.45, 0.55, 0.65, 0.70, 0.72,
  0.75, 0.78, 0.80, 0.82, 0.78, 0.72, 0.68, 0.62, 0.85, 0.92, 1.05, 1.15,
  1.20, 1.18, 0.95, 0.82, 0.70, 0.58, 0.48, 0.40, 0.35, 0.30, 0.28, 0.26,
];

const VALUES_C = [
  0.15, 0.12, 0.10, 0.08, 0.06, 0.05, 0.08, 0.12, 0.22, 0.30, 0.35, 0.38,
  0.40, 0.38, 0.32, 0.28, 0.25, 0.22, 0.24, 0.28, 0.35, 0.42, 0.48, 0.52,
  0.55, 0.58, 0.60, 0.62, 0.58, 0.52, 0.48, 0.42, 0.65, 0.72, 0.82, 0.90,
  0.92, 0.88, 0.72, 0.60, 0.50, 0.42, 0.35, 0.28, 0.22, 0.18, 0.16, 0.14,
];

export const mockSeriesB: ChartSeries = {
  id: 'series-b',
  label: 'Standard',
  data: VALUES_B.map((value, i) => ({
    ts: BASE_DATE + i * HALF_HOUR_MS,
    value,
  })),
  tone: 'positive',
};

export const mockSeriesC: ChartSeries = {
  id: 'series-c',
  label: 'Heat Pump + Battery',
  data: VALUES_C.map((value, i) => ({
    ts: BASE_DATE + i * HALF_HOUR_MS,
    value,
  })),
  tone: 'positive',
};

export const mockBands: ChartBand[] = [
  {
    id: 'band-0',
    startTs: BASE_DATE + 4 * HALF_HOUR_MS,  // 02:00
    endTs: BASE_DATE + 8 * HALF_HOUR_MS,    // 04:00
    label: 'event window',
    tone: 'secondary',
  },
  {
    id: 'band-1',
    startTs: BASE_DATE + 36 * HALF_HOUR_MS, // 18:00
    endTs: BASE_DATE + 39 * HALF_HOUR_MS,   // 19:30
    label: 'peak window',
    tone: 'secondary',
  },
];

export const mockRange = {
  fromTs: mockSeriesA.data[0].ts,
  toTs: mockSeriesA.data[mockSeriesA.data.length - 1].ts,
};
