import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoCard } from '@/components/Bento';
import { MarketPricePanel } from './MarketPricePanel';
import { MarketPricePanelSkeleton } from './MarketPricePanelSkeleton';
import { mockPrices, mockFlexEvents } from './mockData';

/**
 * ## MarketPricePanel
 * Chart panel for energy price data. Renders inside a BentoCard tile.
 *
 * - **Loading**: BentoCard `loading` + `skeleton` props handle the skeleton silhouette.
 * - **Loaded**: Panel renders header, chart, footer, and quick-range bar.
 */
const meta = {
  title: 'Market/MarketPricePanel',
  component: MarketPricePanel,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <BentoCard span={3}>
        <Story />
      </BentoCard>
    ),
  ],
} satisfies Meta<typeof MarketPricePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

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

/** Tile-level skeleton as rendered by BentoCard when market data is loading. */
export const Loading: Story = {
  args: { prices: mockPrices, flexEvents: mockFlexEvents },
  decorators: [
    () => (
      <BentoCard span={3} loading skeleton={<MarketPricePanelSkeleton />}>
        {null}
      </BentoCard>
    ),
  ],
};

/** Renders multiple chart instances to validate performance and stability. */
export const MultiChart: Story = {
  args: { prices: mockPrices, flexEvents: mockFlexEvents },
  decorators: [
    () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <BentoCard span={3}>
          <MarketPricePanel prices={mockPrices} flexEvents={mockFlexEvents} />
        </BentoCard>
        <BentoCard span={3}>
          <MarketPricePanel prices={mockPrices} flexEvents={mockFlexEvents} />
        </BentoCard>
      </div>
    ),
  ],
};
