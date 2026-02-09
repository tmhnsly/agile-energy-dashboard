import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { RangeBrush } from './RangeBrush';
import { mockPrices, mockRange } from '../mockData';

const meta = {
  title: 'Price Market/RangeBrush',
  component: RangeBrush,
  parameters: {
    layout: 'padded',
  },
  args: {
    onRangeChange: fn(),
  },
} satisfies Meta<typeof RangeBrush>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    points: mockPrices,
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
  },
};

export const WithSelection: Story = {
  args: {
    points: mockPrices,
    fullRange: mockRange,
    activeRange: {
      fromTs: mockPrices[10].ts,
      toTs: mockPrices[38].ts,
    },
    width: 800,
  },
};
