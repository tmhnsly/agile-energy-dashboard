import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SampleDataBanner } from './SampleDataBanner';

/** Banner shown when the live Agile price feed is down and the dashboard falls
 *  back to the bundled sample snapshot. Appears at the top of the dashboard. */
const meta = {
  title: 'UI / SampleDataBanner',
  component: SampleDataBanner,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SampleDataBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default appearance — flask icon and message on a warning-coloured strip. */
export const Default: Story = {};
