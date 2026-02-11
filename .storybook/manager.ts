import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const theme = create({
  base: prefersDark ? 'dark' : 'light',
  brandTitle: 'Shuffle Energy',
  brandImage: prefersDark ? '/shuffle-logo-dark.svg' : '/shuffle-logo.svg',
  brandTarget: '_self',
  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: 'monospace',
});

addons.setConfig({ theme });
