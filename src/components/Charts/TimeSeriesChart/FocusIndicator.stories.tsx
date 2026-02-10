import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FocusIndicator } from './FocusIndicator';
import { ChartCanvas, INNER_WIDTH, INNER_HEIGHT } from './storyUtils';

/**
 * Pulsing accent ring rendered at the keyboard-focused data point.
 * Visible only when keyboard navigation is active.
 */
const meta = {
  title: 'Charts / TimeSeriesChart / FocusIndicator',
  component: FocusIndicator,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <ChartCanvas>
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
} satisfies Meta<typeof FocusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Visible pulsing focus ring at the centre of the chart area. */
export const Default: Story = {
  args: {
    x: INNER_WIDTH / 2,
    y: INNER_HEIGHT / 2,
    isVisible: true,
  },
};

/** Hidden state — renders nothing. */
export const Hidden: Story = {
  args: {
    x: INNER_WIDTH / 2,
    y: INNER_HEIGHT / 2,
    isVisible: false,
  },
};
