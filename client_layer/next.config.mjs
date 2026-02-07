/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      // Maps the 'canvas' import to your empty file
      canvas: './empty.js',
    },
  },
  // Keep webpack config as a fallback for production builds
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;