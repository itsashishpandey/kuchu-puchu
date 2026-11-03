import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // build stamp: open tabs compare it with /api/public/version and offer a refresh after a deploy
  env: { NEXT_PUBLIC_BUILD_ID: String(Date.now()) },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // dev only: lets the local dev server be opened as 127.0.0.1 as well as localhost
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
