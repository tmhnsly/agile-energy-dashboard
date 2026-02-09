import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Container } from './Container';

const meta = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: 'var(--space-4)', background: 'var(--mono-subtle-bg)' }}>
        <p style={{ color: 'var(--mono-text)' }}>
          Content is constrained to a max-width with responsive gutters.
          Resize the viewport to see the padding change at each breakpoint.
        </p>
      </div>
    ),
  },
};

export const WithBackground: Story = {
  args: { children: null },
  render: () => (
    <div style={{ background: 'var(--mono-subtle-bg)', padding: 'var(--space-8) 0' }}>
      <Container>
        <div style={{ padding: 'var(--space-4)', background: 'var(--mono-app-bg)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--mono-text)' }}>
            The tinted background extends full-width while the Container constrains the content.
          </p>
        </div>
      </Container>
    </div>
  ),
};
