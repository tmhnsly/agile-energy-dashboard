import path from 'path';
import type { StorybookConfig } from '@storybook/nextjs-vite';

// NOTE: vite and vite-tsconfig-paths are pinned in package.json (pnpm.overrides).
// vite-plugin-storybook-nextjs loads via CJS, which breaks with the ESM-only
// vite 7 and vite-tsconfig-paths 5+. Remove the overrides once the upstream
// packages ship CJS-compatible builds.

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest', '@storybook/addon-toolbars'],
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
  viteFinal: async (config) => {
    config.css = {
      ...config.css,
      preprocessorOptions: {
        ...config.css?.preprocessorOptions,
        scss: {
          ...config.css?.preprocessorOptions?.scss,
          loadPaths: [path.join(process.cwd(), 'src', 'styles')],
        },
      },
    };
    return config;
  },
};
export default config;
