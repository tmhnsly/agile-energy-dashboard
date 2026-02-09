'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      value={{ dark: 'dark-theme', light: 'light-theme' }}
    >
      {children}
    </ThemeProvider>
  );
}
