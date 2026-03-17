/**
 * Fixes absolute asset paths in the Storybook build output so it can be
 * served from the /storybook/ subdirectory inside public/.
 */
import { readFileSync, writeFileSync } from 'fs';

const iframe = 'public/storybook/iframe.html';
const content = readFileSync(iframe, 'utf8');
const fixed = content.replace(
  'src="/vite-inject-mocker-entry.js"',
  'src="./vite-inject-mocker-entry.js"',
);
writeFileSync(iframe, fixed);
