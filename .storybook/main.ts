import type { StorybookConfig } from '@storybook/nextjs-vite';

// NOTE: vite and vite-tsconfig-paths are pinned in package.json (pnpm.overrides).
// vite-plugin-storybook-nextjs loads via CJS, which breaks with the ESM-only
// vite 7 and vite-tsconfig-paths 5+. Remove the overrides once the upstream
// packages ship CJS-compatible builds.

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  features: {
    sidebarOnboardingChecklist: false,
  },
  docs: {
    defaultName: 'Docs',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};
export default config;
