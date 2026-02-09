export interface ChartDataPoint {
  ts: number;
  value: number;
}

export interface ChartSeries {
  id: string;
  label: string;
  data: ChartDataPoint[];
  tone?: 'accent' | 'positive' | 'negative' | 'warning';
}

export interface ChartBand {
  id: string;
  startTs: number;
  endTs: number;
  label?: string;
  tone?: 'warning' | 'accent';
}
