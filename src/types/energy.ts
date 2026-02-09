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
}
