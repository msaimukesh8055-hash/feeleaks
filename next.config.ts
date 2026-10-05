// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Evidence photos are shrunk in the browser; this leaves room for up to 4 files.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
