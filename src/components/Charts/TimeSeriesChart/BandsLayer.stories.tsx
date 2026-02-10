import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BandsLayer } from './BandsLayer';
import { mockBands } from './mockData';
import { ChartCanvas, INNER_WIDTH, INNER_HEIGHT, createMockScales } from './storyUtils';

/**
 * Coloured band overlays that highlight time windows (e.g. flex events, peak periods).
 * Supports default, hovered, and selected visual states.
 */
const meta = {
  title: 'Charts / TimeSeriesChart / BandsLayer',
  component: BandsLayer,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <ChartCanvas>
        <Story />
      </ChartCanvas>
    ),
  ],
} satisfies Meta<typeof BandsLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

const { xScale } = createMockScales();

/** Two bands at default opacity. */
export const Default: Story = {
  args: {
    bands: mockBands,
    innerWidth: INNER_WIDTH,
    innerHeight: INNER_HEIGHT,
    xScale: xScale as unknown as (d: Date) => number,
    selectedBandId: null,
    hoveredBandId: null,
  },
};

/** First band in hover state — slightly higher opacity. */
export const Hovered: Story = {
  args: {
    ...Default.args,
    hoveredBandId: mockBands[0].id,
  },
};

/** First band in selected state — strongest opacity with hover-tone fill. */
export const Selected: Story = {
  args: {
    ...Default.args,
    selectedBandId: mockBands[0].id,
  },
};
