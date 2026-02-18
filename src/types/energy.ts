/** A single half-hourly energy price point (Octopus Agile tariff). */
export interface PricePoint {
  /** Unix milliseconds — start of the half-hour settlement period. */
  ts: number;
  /** Price in pence per kWh, inclusive of VAT. */
  price: number;
}

/** A demand-side flexibility event window (e.g. "turn down" or "shift load"). */
export interface FlexEvent {
  id: string;
  /** Start of the event window (Unix milliseconds). */
  startTs: number;
  /** End of the event window (Unix milliseconds). */
  endTs: number;
  /** Event type, e.g. "turn down". */
  label?: string;
  /** Incentive price in £/kWh for participating in this event. */
  pricePerKwh?: number;
  /** Minimum flexibility in kWh the event requires. */
  minFlexKwh?: number;
  /** Maximum flexibility in kWh the event allows. */
  maxFlexKwh?: number;
}

/** A single row of household electricity consumption data. */
export interface HouseholdUsageRow {
  /** Unix milliseconds — start of the half-hour slot. */
  ts: number;
  /** kWh consumed by a standard household. */
  standard: number;
  /** kWh consumed by a heat-pump household. */
  heatPump: number;
  /** kWh consumed by a heat-pump + battery household. */
  heatPumpBattery: number;
}

/** An inclusive time window `[fromTs, toTs]` in Unix milliseconds. */
export interface TimeRange {
  /** Inclusive start (Unix milliseconds). */
  fromTs: number;
  /** Inclusive end (Unix milliseconds). */
  toTs: number;
}

/** All household keys in display order. */
export const ALL_HOUSEHOLD_KEYS = ['standard', 'heatPump', 'heatPumpBattery'] as const;

/** Which household profile to display. */
export type HouseholdKey = (typeof ALL_HOUSEHOLD_KEYS)[number];

/** Aggregated usage statistics for a household over a time range. */
export interface UsageStats {
  totalKwh: number;
  estimatedCostPence: number;
  peak: { kwh: number; ts: number } | null;
  low: { kwh: number; ts: number } | null;
  count: number;
}

/** Aggregated price statistics for a given time range. */
export interface PriceStats {
  /** Lowest price point in the range, or `null` if empty. */
  min: { price: number; ts: number } | null;
  /** Highest price point in the range, or `null` if empty. */
  max: { price: number; ts: number } | null;
  /** Sum of price values across all half-hour intervals. */
  total: number | null;
  /** Number of half-hour intervals in the range. */
  count: number;
}

/** Potential earnings from participating in a single flex event. */
export interface FlexEarningResult {
  event: FlexEvent;
  /** kWh that could be shifted (clamped to min/max). */
  shiftableKwh: number;
  /** Potential earnings in pence. */
  earningsPence: number;
}

/** Result of simulating a usage shift between two time slots. */
export interface ShiftResult {
  originalCostPence: number;
  newCostPence: number;
  savingPence: number;
}
