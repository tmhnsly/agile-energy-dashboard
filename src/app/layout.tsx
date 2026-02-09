import type { Metadata } from "next";
import "@/styles/globals.scss";
import { Providers } from "./providers";
import { Navbar } from "@/components/Layout";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar title="Shuffle Energy" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
