import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true }, // ⛔ ignores TS build errors
  eslint: { ignoreDuringBuilds: true }, // ⛔ ignores ESLint errors in build
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
