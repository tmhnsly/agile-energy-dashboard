import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Navbar } from './Navbar';
import { SITE_NAME } from '@/config/site';

/**
 * Sticky top navigation bar with a glass blur effect. Includes a brand icon,
 * title, and user avatar. Pass `children` to add action buttons on the right.
 */
const meta = {
  title: 'Layout / Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Navbar with brand title and default avatar. */
export const Default: Story = {
  args: {
    title: SITE_NAME,
  },
};
