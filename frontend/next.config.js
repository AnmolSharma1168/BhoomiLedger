/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  typescript: {
    tsconfigPath: './tsconfig.json'
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
