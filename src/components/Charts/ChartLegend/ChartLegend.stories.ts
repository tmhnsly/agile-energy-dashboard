import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChartLegend } from './ChartLegend';

const meta = {
  title: 'Charts/ChartLegend',
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
      { label: 'Electricity price', type: 'line' },
      { label: 'Demand response window', type: 'band' },
    ],
  },
};
