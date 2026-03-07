'use client';

import { ThemeProvider } from 'next-themes';
import { ThemeColorSync } from '@/components/ThemeColorSync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      value={{ dark: 'dark-theme', light: 'light-theme' }}
    >
      <ThemeColorSync />
      {children}
    </ThemeProvider>
  );
}
