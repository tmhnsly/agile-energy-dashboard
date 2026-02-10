import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SelectionOverlay } from './SelectionOverlay';
import { ChartCanvas, INNER_WIDTH, INNER_HEIGHT } from './storyUtils';

/**
 * Dim overlay with draggable selection handles. The region outside the
 * selection is dimmed; boundary lines and grip-nub handles mark the edges.
 */
const meta = {
  title: 'Charts / TimeSeriesChart / SelectionOverlay',
  component: SelectionOverlay,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <ChartCanvas>
        <Story />
      </ChartCanvas>
    ),
  ],
} satisfies Meta<typeof SelectionOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Selection covering roughly the middle third of the chart. */
export const Default: Story = {
  args: {
    leftX: INNER_WIDTH * 0.3,
    rightX: INNER_WIDTH * 0.7,
    innerWidth: INNER_WIDTH,
    innerHeight: INNER_HEIGHT,
  },
};

/** Very narrow selection — shows how handles behave at small widths. */
export const Narrow: Story = {
  args: {
    leftX: INNER_WIDTH * 0.48,
    rightX: INNER_WIDTH * 0.52,
    innerWidth: INNER_WIDTH,
    innerHeight: INNER_HEIGHT,
  },
};

/** Handles at the edges — no dim regions visible. */
export const FullWidth: Story = {
  args: {
    leftX: 0,
    rightX: INNER_WIDTH,
    innerWidth: INNER_WIDTH,
    innerHeight: INNER_HEIGHT,
  },
};
