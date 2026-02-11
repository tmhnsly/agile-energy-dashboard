import type { Metadata } from "next";
import { Inter, Space_Grotesk, Young_Serif } from "next/font/google";
import "@/styles/globals.scss";
import { Providers } from "./providers";
import { Navbar } from "@/components/Layout";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

export const metadata: Metadata = {
  title: "Shuffle Energy Tech Test",
  description:
    "A Next.js web application demonstrating a Storybook component library.",
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
          <Navbar title="Shuffle Energy" />
          {children}
          <SpeedInsights />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
