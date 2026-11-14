import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ecommerce/shared'],
  // Shared hosting kills the build (SIGKILL, exit -9) during the
  // type-check/lint phase and static generation: it uses too much memory.
  // Skip type-check/lint and restrict build to 1 CPU / no worker threads.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
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
