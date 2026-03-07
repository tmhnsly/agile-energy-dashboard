'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

const THEME_COLORS = {
  dark: '#111113',
  light: '#fcfcfd',
} as const;

/**
 * Syncs `<meta name="theme-color">` with the current next-themes theme.
 * Needed because next-themes toggles classes but doesn't update meta tags.
 * Renders nothing.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === 'light' ? THEME_COLORS.light : THEME_COLORS.dark;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [resolvedTheme]);

  return null;
}
