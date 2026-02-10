import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoTile } from '@/components/Bento';
import { MarketPricePanel } from './MarketPricePanel';
import { MarketPricePanelSkeleton } from './MarketPricePanelSkeleton';
import { mockPrices, mockFlexEvents } from './mockData';

/**
 * ## MarketPricePanel
 * Chart panel for energy price data. Renders inside a BentoTile.
 *
 * - **Presets**: 6h/12h/24h/48h select the **cheapest contiguous window** of that
 *   duration (minimum average price). "All" resets to full range.
 * - **Duration-locked nudging**: after selecting a preset, dragging the chart region
 *   slides the window while preserving the duration — the preset stays highlighted
 *   as long as the duration matches.
 * - **Loading**: BentoTile `loading` + `skeleton` props handle the skeleton silhouette.
 */
const meta = {
  title: 'Market/MarketPricePanel',
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

export const NoPrices: Story = {
  args: {
    prices: [],
    flexEvents: [],
  },
};

/** Demonstrates responsive header, quick-range presets, and chart at narrow width. */
export const MobileWidth: Story = {
  args: {
    prices: mockPrices,
    flexEvents: mockFlexEvents,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/** Demonstrates responsive layout at tablet width. */
export const TabletWidth: Story = {
  args: {
    prices: mockPrices,
    flexEvents: mockFlexEvents,
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

/** Tile-level skeleton as rendered by BentoTile when market data is loading. */
export const Loading: Story = {
  args: { prices: mockPrices, flexEvents: mockFlexEvents },
  decorators: [
    () => (
      <BentoTile variant="wide" loading skeleton={<MarketPricePanelSkeleton />}>
        {null}
      </BentoTile>
    ),
  ],
};

/** Renders multiple chart instances to validate performance and stability. */
export const MultiChart: Story = {
  args: { prices: mockPrices, flexEvents: mockFlexEvents },
  decorators: [
    () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <BentoTile variant="wide">
          <MarketPricePanel prices={mockPrices} flexEvents={mockFlexEvents} />
        </BentoTile>
        <BentoTile variant="wide">
          <MarketPricePanel prices={mockPrices} flexEvents={mockFlexEvents} />
        </BentoTile>
      </div>
    ),
  ],
};
