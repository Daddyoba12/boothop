import type { NextConfig } from "next";

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
