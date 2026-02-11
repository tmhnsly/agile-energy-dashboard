import { addons } from 'storybook/manager-api';
import { create } from '@storybook/theming';

const theme = create({
  base: 'light',
  brandTitle: 'Shuffle Energy',
  brandImage: '/shuffle-logo.svg',
  brandTarget: '_self',
  fontBase: '"Inter", system-ui, sans-serif',
  fontCode: 'monospace',
});

addons.setConfig({ theme });
