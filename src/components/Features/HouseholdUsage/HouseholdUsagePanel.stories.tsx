import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoTile } from '@/components/Layout';
import { HouseholdUsagePanel } from './HouseholdUsagePanel';
import { HouseholdUsageSkeleton } from './HouseholdUsageSkeleton';
import { mockUsage, mockPrices } from './mockData';

/**
 * Household energy usage panel with per-household stats, cost estimation,
 * and a selector to toggle between Standard, Heat Pump, Heat Pump + Battery, or All.
 * Drag the chart to zoom into a time range; stats update live during drag.
 *
 * The panel is self-contained and adapts to its container — wrap in `BentoTile`
 * or any other layout primitive.
 */
const meta = {
  title: 'Features / Household Usage / HouseholdUsagePanel',
  component: HouseholdUsagePanel,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof HouseholdUsagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default view — all household types overlaid. */
export const Default: Story = {
  args: {
    usage: mockUsage,
    prices: mockPrices,
  },
};

/** Inside a BentoTile — matches how it appears on the dashboard. */
export const InBentoTile: Story = {
  args: {
    usage: mockUsage,
    prices: mockPrices,
  },
  decorators: [
    (Story) => (
      <BentoTile span="feature">
        <Story />
      </BentoTile>
    ),
  ],
};

/** Skeleton as rendered by BentoTile while data is loading. */
export const Loading: Story = {
  args: { usage: mockUsage, prices: mockPrices },
  decorators: [
    () => (
      <BentoTile span="feature" loading skeleton={<HouseholdUsageSkeleton />}>
        {null}
      </BentoTile>
    ),
  ],
};
