import { HALF_HOUR_MS } from '@/utils/constants';
import type { HouseholdUsageRow, PricePoint } from '@/types/energy';

/**
 * Deterministic mock data for Storybook stories.
 * 48 half-hourly rows matching realistic household consumption profiles.
 */
const BASE_DATE = new Date('2025-03-12T00:00:00Z').getTime();

const STANDARD_RAW = [
  0.25, 0.22, 0.20, 0.18, 0.17, 0.16, 0.20, 0.25, 0.35, 0.45, 0.50, 0.55,
  0.60, 0.58, 0.52, 0.48, 0.42, 0.38, 0.40, 0.45, 0.55, 0.65, 0.70, 0.72,
  0.75, 0.78, 0.80, 0.82, 0.78, 0.72, 0.68, 0.62, 0.85, 0.92, 1.05, 1.15,
  1.20, 1.18, 0.95, 0.82, 0.70, 0.58, 0.48, 0.40, 0.35, 0.30, 0.28, 0.26,
];

const HEAT_PUMP_RAW = [
  0.80, 0.75, 0.70, 0.65, 0.62, 0.58, 0.65, 0.72, 0.90, 1.05, 1.12, 1.18,
  1.20, 1.15, 1.08, 1.02, 0.95, 0.88, 0.92, 1.00, 1.15, 1.30, 1.40, 1.45,
  1.48, 1.52, 1.55, 1.58, 1.52, 1.45, 1.38, 1.30, 1.60, 1.72, 1.85, 1.95,
  2.00, 1.95, 1.65, 1.45, 1.28, 1.12, 1.00, 0.90, 0.85, 0.82, 0.78, 0.76,
];

const HP_BATTERY_RAW = [
  0.15, 0.12, 0.10, 0.08, 0.06, 0.05, 0.08, 0.12, 0.22, 0.30, 0.35, 0.38,
  0.40, 0.38, 0.32, 0.28, 0.25, 0.22, 0.24, 0.28, 0.35, 0.42, 0.48, 0.52,
  0.55, 0.58, 0.60, 0.62, 0.58, 0.52, 0.48, 0.42, 0.65, 0.72, 0.82, 0.90,
  0.92, 0.88, 0.72, 0.60, 0.50, 0.42, 0.35, 0.28, 0.22, 0.18, 0.16, 0.14,
];

export const mockUsage: HouseholdUsageRow[] = STANDARD_RAW.map((standard, i) => ({
  ts: BASE_DATE + i * HALF_HOUR_MS,
  standard,
  heatPump: HEAT_PUMP_RAW[i],
  heatPumpBattery: HP_BATTERY_RAW[i],
}));

const PRICES_RAW = [
  20.5, 19.8, 19.2, 18.9, 18.6, 17.7, 19.5, 19.8, 20.2, 21.2, 22.4, 23.6,
  24.8, 26.0, 24.4, 24.7, 21.9, 19.4, 19.6, 20.3, 20.0, 21.0, 20.5, 19.5,
  20.1, 19.5, 20.1, 20.2, 20.4, 20.2, 20.1, 20.3, 30.8, 33.5, 38.4, 42.1,
  44.5, 44.5, 28.8, 27.4, 26.2, 24.2, 23.4, 21.6, 20.0, 22.5, 21.8, 20.6,
];

export const mockPrices: PricePoint[] = PRICES_RAW.map((price, i) => ({
  ts: BASE_DATE + i * HALF_HOUR_MS,
  price,
}));
