import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Legend } from './Legend';

const meta = {
  title: 'Price Market/Legend',
  component: Legend,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Legend>;

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
