import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ecommerce/shared'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (config) => {
    // Resolve the shared package straight from its source, so the build
    // never depends on node_modules linking or a prebuilt dist on the server.
    config.resolve.alias['@ecommerce/shared'] = path.resolve(
      __dirname,
      '../../packages/shared/src/index.ts'
    );
    return config;
  },
};

export default nextConfig;
