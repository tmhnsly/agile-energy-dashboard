'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Syncs `<meta name="theme-color">` with the current next-themes theme.
 *
 * Reads the resolved `--app-bg` CSS variable (Radix slate-1) so the browser
 * chrome always matches the design-system background. Replaces the
 * server-rendered media-query meta tags with a single authoritative tag
 * controlled by next-themes' resolved theme.
 *
 * Renders nothing.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-bg')
      .trim();
    if (!color) return;

    // Remove all server-rendered theme-color tags (they use media queries
    // that can conflict with next-themes when system ≠ app preference).
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((el) => el.remove());

    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
  }, [resolvedTheme]);

  return null;
}
