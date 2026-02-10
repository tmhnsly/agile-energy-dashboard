import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MinMaxMarkers } from './MinMaxMarkers';
import { mockSeriesA } from './mockData';
import { ChartCanvas, INNER_WIDTH, INNER_HEIGHT, createMockScales } from './storyUtils';

/**
 * Circle markers and value labels at the min and max data points.
 * Min is green (success tone), max is red (error tone).
 */
const meta = {
  title: 'Charts / TimeSeriesChart / MinMaxMarkers',
  component: MinMaxMarkers,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <ChartCanvas>
        {/* Light reference line so markers have visual context */}
        <rect
          x={0}
          y={0}
          width={INNER_WIDTH}
          height={INNER_HEIGHT}
          fill="var(--mono-subtle-bg)"
          rx={4}
        />
        <Story />
      </ChartCanvas>
    ),
  ],
} satisfies Meta<typeof MinMaxMarkers>;

export default meta;
type Story = StoryObj<typeof meta>;

const { xScale, yScale } = createMockScales();
const data = mockSeriesA.data;
const min = data.reduce((a, b) => (a.value < b.value ? a : b));
const max = data.reduce((a, b) => (a.value > b.value ? a : b));

/** Min and max markers with formatted value labels. */
export const Default: Story = {
  args: {
    min: { ts: min.ts, value: min.value },
    max: { ts: max.ts, value: max.value },
    xScale: xScale as unknown as (d: Date) => number,
    yScale: yScale as unknown as (v: number) => number,
    formatValue: (v: number) => `${v.toFixed(1)}p`,
  },
};
