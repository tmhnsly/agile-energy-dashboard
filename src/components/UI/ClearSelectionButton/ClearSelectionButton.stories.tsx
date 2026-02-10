import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { ClearSelectionButton } from './ClearSelectionButton';

/**
 * Small button that clears the current chart selection (resets to full range).
 * Disabled when no selection is active.
 */
const meta = {
  title: 'UI / ClearSelectionButton',
  component: ClearSelectionButton,
  parameters: {
    layout: 'centered',
  },
  args: { onClick: fn() },
} satisfies Meta<typeof ClearSelectionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Active — a selection exists and can be cleared. */
export const Enabled: Story = {
  args: {
    disabled: false,
  },
};

/** Disabled — no selection to clear. */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
