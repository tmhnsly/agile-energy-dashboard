import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { TimeSeriesChart } from './TimeSeriesChart';
import { mockPrices, mockFlexEvents, mockRange } from '../mockData';

const meta = {
  title: 'Price Market/TimeSeriesChart',
  component: TimeSeriesChart,
  parameters: {
    layout: 'padded',
  },
  args: {
    onRangeChange: fn(),
  },
} satisfies Meta<typeof TimeSeriesChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    points: mockPrices,
    flexEvents: mockFlexEvents,
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
    height: 380,
  },
};

export const NoFlexEvents: Story = {
  args: {
    points: mockPrices,
    flexEvents: [],
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
    height: 380,
  },
};

export const WithSelection: Story = {
  args: {
    points: mockPrices,
    flexEvents: mockFlexEvents,
    fullRange: mockRange,
    activeRange: {
      fromTs: mockPrices[10].ts,
      toTs: mockPrices[38].ts,
    },
    width: 800,
    height: 380,
  },
};

export const FlexEventSelected: Story = {
  args: {
    points: mockPrices,
    flexEvents: mockFlexEvents,
    fullRange: mockRange,
    activeRange: {
      fromTs: mockFlexEvents[1].startTs,
      toTs: mockFlexEvents[1].endTs,
    },
    width: 800,
    height: 380,
  },
};

export const NarrowMobile: Story = {
  args: {
    points: mockPrices,
    flexEvents: mockFlexEvents,
    fullRange: mockRange,
    activeRange: mockRange,
    width: 360,
    height: 240,
  },
};
