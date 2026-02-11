import { addons } from 'storybook/manager-api';
import { create } from '@storybook/theming';

const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const theme = create({
  base: prefersDark ? 'dark' : 'light',
  brandTitle: 'Shuffle Energy',
  brandImage: '/shuffle-logo.svg',
  brandTarget: '_self',
  fontBase: '"Space Grotesk", "Inter", system-ui, sans-serif',
  fontCode: 'monospace',
});

addons.setConfig({ theme });
