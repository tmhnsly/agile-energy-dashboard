import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PriceStatsBar } from './PriceStatsBar';
import { mockStats } from '../mockData';

const meta = {
  title: 'Price Market/PriceStatsBar',
  component: PriceStatsBar,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PriceStatsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stats: mockStats,
  },
};

export const NoData: Story = {
  args: {
    stats: { min: null, max: null },
  },
};
