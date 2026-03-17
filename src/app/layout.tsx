import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.scss";
import { Providers } from "./providers";
import { Navbar } from "@/components/Layout";
import { NavAction } from "@/components/Layout/Navbar/NavAction";
import { TbBook, TbUser } from "react-icons/tb";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#111113" },
  ],
};

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <Providers>
          <Navbar title={SITE_NAME}>
            <NavAction as="a" href="/storybook" target="_blank" rel="noopener noreferrer" aria-label="Storybook">
              <TbBook aria-hidden="true" />
            </NavAction>
            <NavAction aria-label="User menu">
              <TbUser aria-hidden="true" />
            </NavAction>
          </Navbar>
          {children}
          <SpeedInsights />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
