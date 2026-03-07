import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { OfflineBanner } from './OfflineBanner';

/** Banner shown when the browser goes offline. Appears at the top of the dashboard. */
const meta = {
  title: 'UI / OfflineBanner',
  component: OfflineBanner,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof OfflineBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default appearance — icon and message on a warning-coloured strip. */
export const Default: Story = {};
