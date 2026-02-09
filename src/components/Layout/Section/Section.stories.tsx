import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Container } from '../Container/Container';
import { Section } from './Section';

const meta = {
  title: 'Layout/Section',
  component: Section,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StackedSections: Story = {
  args: { children: null },
  render: () => (
    <div>
      <Section variant="default">
        <Container>
          <h2 style={{ color: 'var(--mono-text)', margin: '0 0 var(--space-2) 0' }}>Default variant</h2>
          <p style={{ color: 'var(--mono-text-low-contrast)', margin: 0 }}>Transparent background — inherits from parent.</p>
        </Container>
      </Section>
      <Section variant="surface">
        <Container>
          <h2 style={{ color: 'var(--mono-text)', margin: '0 0 var(--space-2) 0' }}>Surface variant</h2>
          <p style={{ color: 'var(--mono-text-low-contrast)', margin: 0 }}>Subtle background for visual separation.</p>
        </Container>
      </Section>
      <Section variant="contrast">
        <Container>
          <h2 style={{ color: 'var(--mono-text)', margin: '0 0 var(--space-2) 0' }}>Contrast variant</h2>
          <p style={{ color: 'var(--mono-text-low-contrast)', margin: 0 }}>Stronger background for emphasis.</p>
        </Container>
      </Section>
    </div>
  ),
};

export const Sizes: Story = {
  args: { children: null },
  render: () => (
    <div>
      <Section size="small" variant="surface">
        <Container>
          <p style={{ color: 'var(--mono-text)', margin: 0 }}>Small — tighter vertical padding</p>
        </Container>
      </Section>
      <Section size="medium" variant="contrast">
        <Container>
          <p style={{ color: 'var(--mono-text)', margin: 0 }}>Medium (default) — balanced vertical padding</p>
        </Container>
      </Section>
      <Section size="large" variant="surface">
        <Container>
          <p style={{ color: 'var(--mono-text)', margin: 0 }}>Large — generous vertical padding</p>
        </Container>
      </Section>
    </div>
  ),
};
