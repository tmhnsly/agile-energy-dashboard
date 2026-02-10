export interface PricePoint {
  ts: number;
  price: number;
}

export interface FlexEvent {
  id: string;
  startTs: number;
  endTs: number;
  label?: string;
}

export interface HouseholdUsageRow {
  ts: number;
  standard: number;
  heatPump: number;
  heatPumpBattery: number;
}

export interface TimeRange {
  fromTs: number;
  toTs: number;
}

export interface PriceStats {
  min: { price: number; ts: number } | null;
  max: { price: number; ts: number } | null;
  /** Sum of price values across all intervals in the range. */
  total: number | null;
  /** Number of half-hour intervals in the range. */
  count: number;
}
