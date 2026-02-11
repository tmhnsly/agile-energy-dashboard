import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src", "styles")],
  },
  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
