import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", 
  // This means: "If I am coding on my computer, turn PWA off. If I am on Vercel, turn it on."
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-39f01a5c44b74382a3af896226564088.r2.dev',
        pathname: '/**', // Allows all folders in your R2 bucket
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Keeps Supabase access alive for avatars/old files
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);