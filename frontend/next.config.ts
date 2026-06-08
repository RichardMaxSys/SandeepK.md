import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint runs separately via `npm run lint` — skip during build to avoid
  // an eslint v8 / v9 version mismatch with eslint-config-next v15.1.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
