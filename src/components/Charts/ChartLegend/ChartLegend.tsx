import { memo } from 'react';
import styles from './ChartLegend.module.scss';

export interface ChartLegendProps {
  items?: { label: string; type: 'line' | 'band' }[];
}

const DEFAULT_ITEMS: ChartLegendProps['items'] = [
  { label: 'Price (inc. VAT)', type: 'line' },
  { label: 'Flex event', type: 'band' },
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
            aria-hidden="true"
          />
          <span className={styles.label}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
});
