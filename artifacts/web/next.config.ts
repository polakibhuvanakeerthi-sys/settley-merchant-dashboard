import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: [
    process.env.REPLIT_DEV_DOMAIN,
    '127.0.0.1',
    'localhost',
  ].filter((origin): origin is string => Boolean(origin)),
};

export default nextConfig;