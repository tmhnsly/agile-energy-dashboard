import { useState, useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { TimeRange } from "@/types/energy";
import { lowerBound, upperBound } from "@/utils/binarySearch";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { mockSeriesA, mockSeriesB, mockBands, mockRange } from "./mockData";

const meta = {
  title: "Charts/TimeSeriesChart",
  component: TimeSeriesChart,
  parameters: {
    layout: "padded",
  },
  args: {
    onRangeChange: fn(),
  },
} satisfies Meta<typeof TimeSeriesChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    series: [mockSeriesA],
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
    height: 380,
  },
};

export const WithBands: Story = {
  args: {
    series: [mockSeriesA],
    bands: mockBands,
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
    height: 380,
  },
};

export const MultiSeries: Story = {
  args: {
    series: [mockSeriesA, mockSeriesB],
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
    height: 380,
  },
};

export const WithSelection: Story = {
  args: {
    series: [mockSeriesA],
    bands: mockBands,
    fullRange: mockRange,
    activeRange: {
      fromTs: mockSeriesA.data[10].ts,
      toTs: mockSeriesA.data[38].ts,
    },
    width: 800,
    height: 380,
  },
};

export const NarrowMobile: Story = {
  args: {
    series: [mockSeriesA],
    bands: mockBands,
    fullRange: mockRange,
    activeRange: mockRange,
    width: 360,
    height: 240,
  },
};

/**
 * Interactive demo: drag selection edges and watch min/max markers
 * update live. Demonstrates the generic chart with drag selection
 * and live range preview.
 */
export const InteractiveLiveStats: Story = {
  render: function InteractiveLiveStats() {
    const [activeRange, setActiveRange] = useState<TimeRange>(mockRange);
    const [previewRange, setPreviewRange] = useState<TimeRange | null>(null);
    const displayRange = previewRange ?? activeRange;

    const stats = useMemo(() => {
      const data = mockSeriesA.data;
      const start = lowerBound(data, displayRange.fromTs);
      const end = upperBound(data, displayRange.toTs);
      if (start >= end) return { min: null, max: null };
      let min = data[start];
      let max = data[start];
      for (let i = start + 1; i < end; i++) {
        if (data[i].value < min.value) min = data[i];
        if (data[i].value > max.value) max = data[i];
      }
      return {
        min: { value: min.value, ts: min.ts },
        max: { value: max.value, ts: max.ts },
      };
    }, [displayRange]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
          <span>Min: {stats.min ? stats.min.value.toFixed(1) : "—"}</span>
          <span>Max: {stats.max ? stats.max.value.toFixed(1) : "—"}</span>
        </div>
        <TimeSeriesChart
          series={[mockSeriesA]}
          bands={mockBands}
          fullRange={mockRange}
          activeRange={activeRange}
          onRangeChange={setActiveRange}
          onRangePreview={setPreviewRange}
          width={800}
          height={380}
        />
        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
          Drag selection handles or draw a new selection to see min/max markers
          update live. Click on band overlays to select them.
        </p>
      </div>
    );
  },
  args: {
    series: [mockSeriesA],
    bands: mockBands,
    fullRange: mockRange,
    activeRange: mockRange,
    width: 800,
    height: 380,
  },
};
