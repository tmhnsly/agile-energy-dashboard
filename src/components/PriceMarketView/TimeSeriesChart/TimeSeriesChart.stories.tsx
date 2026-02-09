import { useState, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import type { TimeRange } from '@/types/energy';
import { lowerBound, upperBound } from '@/utils/binarySearch';
import { TimeSeriesChart } from './TimeSeriesChart';
import { PriceStatsBar } from '../PriceStatsBar/PriceStatsBar';
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

/**
 * Interactive demo: drag selection edges and watch:
 * - Low/High stat cards update live (via onRangePreview → PriceStatsBar)
 * - Min/Max triangle markers on the chart move live and stay in sync
 * - Flex band hover only fires when pointer is truly over a band
 */
export const InteractiveLiveStats: Story = {
  render: function InteractiveLiveStats() {
    const [activeRange, setActiveRange] = useState<TimeRange>(mockRange);
    const [previewRange, setPreviewRange] = useState<TimeRange | null>(null);
    const displayRange = previewRange ?? activeRange;

    const stats = useMemo(() => {
      const start = lowerBound(mockPrices, displayRange.fromTs);
      const end = upperBound(mockPrices, displayRange.toTs);
      if (start >= end) return { min: null, max: null };
      let min = mockPrices[start];
      let max = mockPrices[start];
      for (let i = start + 1; i < end; i++) {
        if (mockPrices[i].price < min.price) min = mockPrices[i];
        if (mockPrices[i].price > max.price) max = mockPrices[i];
      }
      return {
        min: { price: min.price, ts: min.ts },
        max: { price: max.price, ts: max.ts },
      };
    }, [displayRange]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PriceStatsBar stats={stats} />
        <TimeSeriesChart
          points={mockPrices}
          flexEvents={mockFlexEvents}
          fullRange={mockRange}
          activeRange={activeRange}
          onRangeChange={setActiveRange}
          onRangePreview={setPreviewRange}
          width={800}
          height={380}
        />
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
          Drag selection handles or the window to see Low/High cards and triangle
          markers update live in sync. Hover flex zones (amber bands) to verify
          hover only appears when pointer is truly inside a band.
        </p>
      </div>
    );
  },
  args: {
    points: mockPrices,
    flexEvents: mockFlexEvents,
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
    height: 380,
  },
};
