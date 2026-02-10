import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoTile } from '@/components/Layout';
import { MarketPricePanel } from './MarketPricePanel';
import { MarketPriceSkeleton } from './MarketPriceSkeleton';
import { mockPrices, mockFlexEvents } from './mockData';

/**
 * Market-price panel with stat cards, time-range presets, and flex-event overlays.
 * Clicking a preset (6 h, 12 h, etc.) jumps to the cheapest window of that length;
 * dragging the chart slides the window without changing its duration.
 *
 * The panel is self-contained and adapts to its container — wrap in `BentoTile`
 * or any other layout primitive.
 */
const meta = {
  title: 'Features / Market Price / MarketPricePanel',
  component: MarketPricePanel,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MarketPricePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default view — "All" preset active. */
export const Default: Story = {
  args: {
    prices: mockPrices,
    flexEvents: mockFlexEvents,
  },
};

/** Empty state when no price data is available. */
export const NoPrices: Story = {
  args: {
    prices: [],
    flexEvents: [],
  },
};

/** Inside a BentoTile — matches how it appears on the dashboard. */
export const InBentoTile: Story = {
  args: {
    prices: mockPrices,
    flexEvents: mockFlexEvents,
  },
  decorators: [
    (Story) => (
      <BentoTile span="wide">
        <Story />
      </BentoTile>
    ),
  ],
};

/** Skeleton as rendered by BentoTile while data is loading. */
export const Loading: Story = {
  args: { prices: mockPrices, flexEvents: mockFlexEvents },
  decorators: [
    () => (
      <BentoTile span="wide" loading skeleton={<MarketPriceSkeleton />}>
        {null}
      </BentoTile>
    ),
  ],
};
