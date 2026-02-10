import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PriceStatsBar } from './PriceStatsBar';
import { mockStats, mockRange } from '../mockData';

const meta = {
  title: 'Price Market/PriceStatsBar',
  component: PriceStatsBar,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PriceStatsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Multi-day range — LOW/HIGH show day name + time (e.g. "Wed 02:30"). */
export const Default: Story = {
  args: {
    stats: mockStats,
    range: mockRange,
  },
};

/** Single-day range — LOW/HIGH show time only (e.g. "02:30"). */
export const SameDay: Story = {
  args: {
    stats: mockStats,
    range: {
      fromTs: mockRange.fromTs,
      toTs: mockRange.fromTs + 12 * 60 * 60 * 1000,
    },
  },
};

export const NoData: Story = {
  args: {
    stats: { min: null, max: null, total: null, count: 0 },
    range: mockRange,
  },
};
