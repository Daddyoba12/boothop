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
      // Intercept Oracle's onboard API call — saves to Supabase then forwards to Oracle
      {
        source: '/api/onboard',
        destination: '/api/pipeline/onboard',
      },
      // /client-onboarding page served by Oracle (their multi-step form)
      {
        source: '/client-onboarding',
        destination: `${ORACLE_HOST}/client-onboarding`,
      },
      // /onboard/admin/* → Oracle admin (when Oracle builds it)
      {
        source: '/onboard/admin/:path*',
        destination: `${ORACLE_HOST}/admin/:path*`,
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
      // /pipeline/commander/* → commander.boothop.com
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
      // /onboard → /client-onboarding (client-onboarding is the canonical URL)
      {
        source: '/onboard',
        destination: '/client-onboarding',
        permanent: false,
      },
      {
        source: '/pipeline/onboard',
        destination: '/client-onboarding',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
