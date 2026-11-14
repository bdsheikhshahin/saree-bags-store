/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ecommerce/shared'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
export default nextConfig;
