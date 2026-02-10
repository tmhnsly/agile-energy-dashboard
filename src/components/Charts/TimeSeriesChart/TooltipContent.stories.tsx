import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TooltipContent } from './TooltipLayer';
import { mockSeriesA, mockSeriesB, mockSeriesC, mockBands } from './mockData';
import styles from './TimeSeriesChart.module.scss';

const midPoint = mockSeriesA.data[24];
const bandPoint = mockSeriesA.data[6];

/**
 * HTML tooltip body showing timestamp, series values, and optional band info.
 * Rendered inside a portal by the parent chart — shown here standalone.
 */
const meta = {
  title: 'Charts / TimeSeriesChart / TooltipContent',
  component: TooltipContent,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className={styles.tooltip} style={{ width: 'fit-content' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TooltipContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standard tooltip with timestamp and price value. */
export const Default: Story = {
  args: {
    tooltipData: {
      ts: midPoint.ts,
      values: [{ seriesId: 'price', label: 'Price', value: midPoint.value, tone: 'accent' }],
      inBand: null,
    },
    formatTooltipValue: (v: number) => `${v.toFixed(1)}p/kWh`,
  },
};

/** Tooltip when hovering inside a band — shows the band badge and label. */
export const WithBand: Story = {
  args: {
    tooltipData: {
      ts: bandPoint.ts,
      values: [{ seriesId: 'price', label: 'Price', value: bandPoint.value, tone: 'accent' }],
      inBand: mockBands[0],
    },
    formatTooltipValue: (v: number) => `${v.toFixed(1)}p/kWh`,
  },
};

/** Multi-series tooltip — three coloured value rows with swatches and labels. */
export const MultiSeries: Story = {
  args: {
    tooltipData: {
      ts: midPoint.ts,
      values: [
        { seriesId: mockSeriesA.id, label: mockSeriesA.label, value: mockSeriesA.data[24].value, tone: 'accent' },
        { seriesId: mockSeriesB.id, label: mockSeriesB.label, value: mockSeriesB.data[24].value, tone: 'positive' },
        { seriesId: mockSeriesC.id, label: mockSeriesC.label, value: mockSeriesC.data[24].value, tone: 'positive' },
      ],
      inBand: null,
    },
    formatTooltipValue: (v: number) => `${v.toFixed(2)}`,
  },
};
