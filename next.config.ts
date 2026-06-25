import type { NextConfig } from "next";

const ORACLE_HOST = 'http://140.238.73.32:1030';

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: '**.blogspot.com' },
      { protocol: 'https', hostname: 'blogger.googleusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      // Commander dashboard — all routes proxied to Oracle
      {
        source: '/pipeline/commander/:path*',
        destination: `${ORACLE_HOST}/:path*`,
      },
      // Onboarding form
      {
        source: '/pipeline/onboard',
        destination: `${ORACLE_HOST}/onboard`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'boothop.com' }],
        destination: 'https://www.boothop.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
