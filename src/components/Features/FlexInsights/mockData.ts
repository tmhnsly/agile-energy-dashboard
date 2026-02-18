import { HALF_HOUR_MS } from '@/utils/constants';
import type { FlexEvent, HouseholdUsageRow } from '@/types/energy';
import { BASE_DATE, MOCK_PRICES } from '@/test/fixtures/marketData';

export const mockPrices = MOCK_PRICES;

export const mockFlexEvents: FlexEvent[] = [
  {
    id: 'flex-0',
    startTs: BASE_DATE + 4 * HALF_HOUR_MS,  // 02:00
    endTs: BASE_DATE + 8 * HALF_HOUR_MS,    // 04:00
    label: 'demand turn up',
    pricePerKwh: 0.8,
    minFlexKwh: 0.5,
    maxFlexKwh: 4.0,
  },
  {
    id: 'flex-1',
    startTs: BASE_DATE + 36 * HALF_HOUR_MS, // 18:00
    endTs: BASE_DATE + 39 * HALF_HOUR_MS,   // 19:30
    label: 'demand turn down',
    pricePerKwh: 1.5,
    minFlexKwh: 0.5,
    maxFlexKwh: 3.0,
  },
];

/** Realistic half-hourly usage aligned to the same BASE_DATE as prices. */
const USAGE_STANDARD = [
  0.40, 0.35, 0.30, 0.28, 0.25, 0.22, 0.20, 0.22, 0.30, 0.45, 0.55, 0.65,
  0.70, 0.75, 0.68, 0.62, 0.58, 0.55, 0.50, 0.48, 0.52, 0.60, 0.72, 0.80,
  0.85, 0.78, 0.72, 0.68, 0.65, 0.62, 0.60, 0.58, 0.65, 0.78, 0.90, 1.05,
  1.20, 1.15, 1.00, 0.88, 0.75, 0.65, 0.55, 0.50, 0.45, 0.42, 0.40, 0.38,
];

const USAGE_HP = [
  0.60, 0.55, 0.50, 0.48, 0.45, 0.40, 0.38, 0.42, 0.55, 0.70, 0.85, 1.00,
  1.10, 1.15, 1.05, 0.95, 0.88, 0.82, 0.78, 0.75, 0.80, 0.90, 1.05, 1.20,
  1.30, 1.20, 1.10, 1.02, 0.98, 0.95, 0.92, 0.90, 1.00, 1.20, 1.40, 1.60,
  1.80, 1.70, 1.50, 1.30, 1.15, 1.00, 0.85, 0.75, 0.68, 0.62, 0.58, 0.55,
];

const USAGE_HPB = [
  0.55, 0.50, 0.45, 0.42, 0.38, 0.35, 0.32, 0.35, 0.48, 0.62, 0.75, 0.88,
  0.95, 1.00, 0.92, 0.85, 0.78, 0.72, 0.68, 0.65, 0.70, 0.80, 0.92, 1.05,
  1.15, 1.05, 0.98, 0.92, 0.88, 0.85, 0.82, 0.80, 0.88, 1.05, 1.22, 1.40,
  1.55, 1.48, 1.30, 1.15, 1.00, 0.88, 0.75, 0.65, 0.60, 0.55, 0.52, 0.50,
];

export const mockUsage: HouseholdUsageRow[] = USAGE_STANDARD.map((_, i) => ({
  ts: BASE_DATE + i * HALF_HOUR_MS,
  standard: USAGE_STANDARD[i],
  heatPump: USAGE_HP[i],
  heatPumpBattery: USAGE_HPB[i],
}));
