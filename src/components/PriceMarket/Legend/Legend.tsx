import styles from './Legend.module.scss';

export interface LegendProps {
  items?: { label: string; type: 'line' | 'band' }[];
}

const DEFAULT_ITEMS: LegendProps['items'] = [
  { label: 'Price (inc. VAT)', type: 'line' },
  { label: 'Flex event', type: 'band' },
];

export const Legend = ({ items = DEFAULT_ITEMS }: LegendProps) => {
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
};
