import type { NextConfig } from "next";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import withSerwistInit from "@serwist/next";

const offlineRevision = crypto
  .createHash("md5")
  .update(fs.readFileSync("src/app/~offline/page.tsx", "utf-8"))
  .digest("hex");

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision: offlineRevision }],
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src", "styles")],
  },
  experimental: {
    inlineCss: true,
  },
};

export default withSerwist(nextConfig);
