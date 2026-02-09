import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PriceMarketView } from './PriceMarketView';
import { mockPrices, mockFlexEvents } from '../mockData';

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
