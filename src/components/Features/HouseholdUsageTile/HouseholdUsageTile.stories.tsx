import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoTile } from '@/components/Layout';
import { HouseholdUsagePanel } from './HouseholdUsagePanel';
import { HouseholdUsageTileSkeleton } from './HouseholdUsageTileSkeleton';
import { mockUsage, mockPrices } from './mockData';

/**
 * Household energy usage chart with per-household stats, cost estimation,
 * and a selector to toggle between Standard, Heat Pump, HP + Battery, or All.
 * Drag the chart to zoom into a time range; stats update live during drag.
 *
 * Wrap in `BentoTile` with `loading` + `skeleton={<HouseholdUsageTileSkeleton />}` for the loading state.
 */
const meta = {
  title: 'Features / Household Usage / HouseholdUsageTile',
  component: HouseholdUsagePanel,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <BentoTile variant="feature">
        <Story />
      </BentoTile>
    ),
  ],
} satisfies Meta<typeof HouseholdUsagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view — "All" households overlaid. Click a household type to
 * isolate it and see peak / total / cost stats for that profile.
 */
export const Default: Story = {
  args: {
    usage: mockUsage,
    prices: mockPrices,
  },
};

/** Single household selected — shows min/max markers on chart. */
export const SingleHousehold: Story = {
  args: {
    usage: mockUsage,
    prices: mockPrices,
  },
};

/** Tile-level skeleton as rendered by BentoTile when data is loading. */
export const Loading: Story = {
  args: { usage: mockUsage, prices: mockPrices },
  decorators: [
    () => (
      <BentoTile variant="feature" loading skeleton={<HouseholdUsageTileSkeleton />}>
        {null}
      </BentoTile>
    ),
  ],
};
