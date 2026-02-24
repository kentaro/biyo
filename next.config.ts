import path from 'node:path';
import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/biyo' : '',
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
