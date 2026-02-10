import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChartLegend } from './ChartLegend';

/** Colour-swatch legend for chart lines and band overlays. Defaults to the Price + Flex pair. */
const meta = {
  title: 'Charts / ChartLegend',
  component: ChartLegend,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChartLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Custom: Story = {
  args: {
    items: [
      { label: 'Electricity price', type: 'line', tone: 'accent' },
      { label: 'Demand response window', type: 'band', tone: 'secondary' },
    ],
  },
};

/** All tone variants for line swatches. */
export const LineTones: Story = {
  args: {
    items: [
      { label: 'Accent', type: 'line', tone: 'accent' },
      { label: 'Secondary', type: 'line', tone: 'secondary' },
      { label: 'Positive', type: 'line', tone: 'positive' },
      { label: 'Negative', type: 'line', tone: 'negative' },
      { label: 'Warning', type: 'line', tone: 'warning' },
    ],
  },
};

/** All tone variants for band swatches. */
export const BandTones: Story = {
  args: {
    items: [
      { label: 'Accent', type: 'band', tone: 'accent' },
      { label: 'Secondary', type: 'band', tone: 'secondary' },
      { label: 'Positive', type: 'band', tone: 'positive' },
      { label: 'Negative', type: 'band', tone: 'negative' },
      { label: 'Warning', type: 'band', tone: 'warning' },
    ],
  },
};
