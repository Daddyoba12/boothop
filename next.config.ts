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
        source: '/onboard/admin/:path*',
        destination: `${ORACLE_HOST}/admin/:path*`,
      },
      {
        source: '/pipeline/onboard',
        destination: `${ORACLE_HOST}/onboard`,
      },
    ];
  },
  async redirects() {
    return [
      // Redirect bare boothop.com to www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'boothop.com' }],
        destination: 'https://www.boothop.com/:path*',
        permanent: true,
      },
      // /pipeline/commander/* → commander.boothop.com (subdomain is the real entry point)
      {
        source: '/pipeline/commander',
        destination: 'https://commander.boothop.com',
        permanent: false,
      },
      {
        source: '/pipeline/commander/:path*',
        destination: 'https://commander.boothop.com/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
