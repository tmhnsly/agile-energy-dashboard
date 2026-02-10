import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoTile } from '@/components/Layout';
import { MarketPricePanel } from './MarketPricePanel';
import { MarketPriceTileSkeleton } from './MarketPriceTileSkeleton';
import { mockPrices, mockFlexEvents } from './mockData';

/**
 * Energy price chart with stat cards, time-range presets, and flex-event overlays.
 * Clicking a preset (6 h, 12 h, etc.) jumps to the cheapest window of that length;
 * dragging the chart afterwards slides the window without changing its duration.
 * The layout adapts to the tile's width, not the viewport — resize the tile to see it.
 *
 * Wrap in `BentoTile` with `loading` + `skeleton={<MarketPriceTileSkeleton />}` for the loading state.
 */
const meta = {
  title: 'Features / Market & Price / MarketPriceTile',
  component: MarketPricePanel,
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
} satisfies Meta<typeof MarketPricePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view — "All" preset active. Click 6h to jump to the cheapest
 * 6-hour window, then drag the selection to nudge it (duration stays locked).
 */
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

/** Tile-level skeleton as rendered by BentoTile when market data is loading. */
export const Loading: Story = {
  args: { prices: mockPrices, flexEvents: mockFlexEvents },
  decorators: [
    () => (
      <BentoTile variant="wide" loading skeleton={<MarketPriceTileSkeleton />}>
        {null}
      </BentoTile>
    ),
  ],
};
