import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true }, // ⛔ ignores TS build errors
  eslint: { ignoreDuringBuilds: true }, // ⛔ ignores ESLint errors in build

  // Static export for Capacitor (optional - only if you want to bundle the app)
  // output: 'export',

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    // For static export compatibility
    unoptimized: false,
  },

  // Ensure trailing slashes for Capacitor compatibility
  trailingSlash: true,
};

export default nextConfig;
