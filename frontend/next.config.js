/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  },
  webpack: (config, { isServer }) => {
    config.optimization.minimize = true;
    return config;
  },
  experimental: {
    optimizeCss: true,
  }
};

module.exports = nextConfig;
