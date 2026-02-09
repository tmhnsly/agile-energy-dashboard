import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PriceMarketView } from './PriceMarketView';
import { mockPrices, mockFlexEvents } from './mockData';

const meta = {
  title: 'Price Market/PriceMarketView',
  component: PriceMarketView,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PriceMarketView>;

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

/** Renders multiple chart instances to validate performance and stability. */
export const MultiChart: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PriceMarketView prices={mockPrices} flexEvents={mockFlexEvents} />
      <PriceMarketView prices={mockPrices} flexEvents={mockFlexEvents} />
      <PriceMarketView prices={mockPrices} flexEvents={mockFlexEvents} />
    </div>
  ),
};
