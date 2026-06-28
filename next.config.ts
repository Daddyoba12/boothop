import type { NextConfig } from "next";

const ORACLE_HOST = 'http://140.238.73.32';

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
      // OTB Dashboard — onboarding & admin
      {
        source: '/onboard',
        destination: `${ORACLE_HOST}/onboard`,
      },
      {
        source: '/client-onboarding',
        destination: `${ORACLE_HOST}/client-onboarding`,
      },
      {
        source: '/admin/:path*',
        destination: `${ORACLE_HOST}/admin/:path*`,
      },
      // Commander dashboard — all routes proxied to Oracle (legacy)
      {
        source: '/pipeline/commander/:path*',
        destination: `${ORACLE_HOST}/:path*`,
      },
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
