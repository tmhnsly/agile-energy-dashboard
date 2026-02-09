import type { ChartSeries, ChartBand } from '@/types/chart';

/**
 * Deterministic mock data for generic chart Storybook stories.
 * Uses the same numeric values as the price mock data, in generic shape.
 */
const BASE_DATE = new Date('2025-03-12T00:00:00Z').getTime();
const HALF_HOUR = 30 * 60 * 1000;

const VALUES_A = [
  20.5, 19.8, 19.2, 18.9, 18.6, 17.7, 19.5, 19.8, 20.2, 21.2, 22.4, 23.6,
  24.8, 26.0, 24.4, 24.7, 21.9, 19.4, 19.6, 20.3, 20.0, 21.0, 20.5, 19.5,
  20.1, 19.5, 20.1, 20.2, 20.4, 20.2, 20.1, 20.3, 30.8, 33.5, 38.4, 42.1,
  44.5, 44.5, 28.8, 27.4, 26.2, 24.2, 23.4, 21.6, 20.0, 22.5, 21.8, 20.6,
];

const VALUES_B = [
  18.2, 17.5, 17.0, 16.8, 16.5, 15.9, 17.3, 17.6, 18.0, 19.0, 20.1, 21.2,
  22.3, 23.5, 22.0, 22.3, 19.7, 17.5, 17.7, 18.3, 18.0, 19.0, 18.5, 17.6,
  18.1, 17.6, 18.1, 18.2, 18.4, 18.2, 18.1, 18.3, 28.0, 30.5, 35.0, 38.5,
  41.0, 41.0, 26.0, 25.0, 23.8, 22.0, 21.2, 19.5, 18.0, 20.3, 19.7, 18.5,
];

export const mockSeriesA: ChartSeries = {
  id: 'series-a',
  label: 'Series A',
  data: VALUES_A.map((value, i) => ({
    ts: BASE_DATE + i * HALF_HOUR,
    value,
  })),
  tone: 'accent',
};

export const mockSeriesB: ChartSeries = {
  id: 'series-b',
  label: 'Series B',
  data: VALUES_B.map((value, i) => ({
    ts: BASE_DATE + i * HALF_HOUR,
    value,
  })),
  tone: 'positive',
};

export const mockBands: ChartBand[] = [
  {
    id: 'band-0',
    startTs: BASE_DATE + 4 * HALF_HOUR,  // 02:00
    endTs: BASE_DATE + 8 * HALF_HOUR,    // 04:00
    label: 'event window',
    tone: 'warning',
  },
  {
    id: 'band-1',
    startTs: BASE_DATE + 36 * HALF_HOUR, // 18:00
    endTs: BASE_DATE + 39 * HALF_HOUR,   // 19:30
    label: 'peak window',
    tone: 'warning',
  },
];

export const mockRange = {
  fromTs: mockSeriesA.data[0].ts,
  toTs: mockSeriesA.data[mockSeriesA.data.length - 1].ts,
};
