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
    <div className={styles.legend}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <span
            className={
              item.type === 'line' ? styles.swatchLine : styles.swatchBand
            }
          />
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
  );
});
