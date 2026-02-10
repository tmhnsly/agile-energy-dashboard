import { memo } from 'react';
import type { ChartTone } from '@/types/chart';
import styles from './ChartLegend.module.scss';

export interface ChartLegendItem {
  label: string;
  type: 'line' | 'band';
  tone?: ChartTone;
}

export interface ChartLegendProps {
  items?: ChartLegendItem[];
}

const DEFAULT_ITEMS: ChartLegendProps['items'] = [
  { label: 'Price (inc. VAT)', type: 'line', tone: 'accent' },
  { label: 'Flex event', type: 'band', tone: 'secondary' },
];

export const ChartLegend = memo(function ChartLegend({ items = DEFAULT_ITEMS }: ChartLegendProps) {
  return (
    <ul className={styles.legend} aria-label="Chart legend">
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          <span
            className={
              item.type === 'line' ? styles.swatchLine : styles.swatchBand
            }
            data-tone={item.tone ?? 'accent'}
            aria-hidden="true"
          />
          <span className={styles.label}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
});
