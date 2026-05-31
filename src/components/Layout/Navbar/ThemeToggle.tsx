'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { TbSun, TbMoon } from 'react-icons/tb';
import { NavAction } from './NavAction';

const subscribe = () => () => {};

/**
 * `false` during SSR and the initial hydration render, `true` afterwards.
 * Lets us defer theme-dependent output until the client knows the resolved
 * theme, avoiding a hydration mismatch — without a setState-in-effect.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Navbar button that switches between the light and dark themes.
 *
 * Reads next-themes' `resolvedTheme`, so it works whether the user is on an
 * explicit choice or following the system preference, and shows the icon for
 * the theme it will switch *to*. Until hydrated it shows a stable icon and a
 * generic label, since the server can't know the resolved theme.
 */
export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const isDark = resolvedTheme === 'dark';
  const label = hydrated ? `Switch to ${isDark ? 'light' : 'dark'} theme` : 'Toggle theme';

  return (
    <NavAction
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {hydrated && isDark ? <TbSun aria-hidden="true" /> : <TbMoon aria-hidden="true" />}
    </NavAction>
  );
};
