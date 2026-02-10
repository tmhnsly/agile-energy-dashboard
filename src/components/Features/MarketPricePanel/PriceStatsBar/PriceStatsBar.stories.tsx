import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoTile } from '@/components/Layout';
import { PriceStatsBar } from './PriceStatsBar';
import { mockStats, mockRange } from '../mockData';

/**
 * Row of Low, High, and Total stat cards for a time range. Used inside the
 * `MarketPricePanel` header. Sub-values always show day and time (e.g. "Wed 02:30").
 */
const meta = {
  title: 'Features / Market & Price / PriceStatsBar',
  component: PriceStatsBar,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <BentoTile variant="wide">
        <Story />
      </BentoTile>
    ),
  ],
} satisfies Meta<typeof PriceStatsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full range with low, high and total stats populated. */
export const Default: Story = {
  args: {
    stats: mockStats,
    range: mockRange,
  },
};

/** Narrower sub-range within a single day. */
export const SubRange: Story = {
  args: {
    stats: mockStats,
    range: {
      fromTs: mockRange.fromTs,
      toTs: mockRange.fromTs + 12 * 60 * 60 * 1000,
    },
  },
};

/** Empty state when no price data is available. */
export const NoData: Story = {
  args: {
    stats: { min: null, max: null, total: null, count: 0 },
    range: mockRange,
  },
};
