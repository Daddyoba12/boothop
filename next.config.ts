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
      { protocol: 'https', hostname: 'i.ytimg.com' },
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
      // /videoEditor → OTB Pipeline Dashboard (FastAPI on Oracle:8080)
      // Proxied with BASE_PATH=/videoEditor so all internal links/API calls stay within /videoEditor/
      {
        source: '/videoEditor',
        destination: `${ORACLE_HOST}:8080/login`,
      },
      {
        source: '/videoEditor/:path*',
        destination: `${ORACLE_HOST}:8080/:path*`,
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
      // /pipeline/commander → /commander (Commander is now native in Next.js)
      {
        source: '/pipeline/commander',
        destination: '/commander',
        permanent: false,
      },
      {
        source: '/pipeline/commander/:path*',
        destination: '/commander/:path*',
        permanent: false,
      },
      // commander.boothop.com → /commander (subdomain alias)
      // .well-known is excluded so Vercel serves it as a static file directly
      {
        source: '/:path((?!\\.well-known).*)',
        has: [{ type: 'host', value: 'commander.boothop.com' }],
        destination: 'https://www.boothop.com/commander/:path*',
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
