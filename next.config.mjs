/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  // Enable static optimization for fast page loads
  reactStrictMode: true,
  
  // Improve image loading performance
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400, // Cache images for 24 hours
  },
  
  // Optimize JavaScript bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Optimize loading performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    turbo: {
      loaders: {
        // Optimize loading of specific file types
        '.js': ['babel-loader'],
        '.tsx': ['babel-loader'],
        '.ts': ['babel-loader'],
      },
    },
  },

  // Optimize for faster builds in development
  swcMinify: true,
  
  // Enable Critters CSS inlining for improved First Contentful Paint
  webpack: (config) => {
    return config;
  },
  
  // Optimize page loading speed with improved caching
  poweredByHeader: false,
  onDemandEntries: {
    // Keep the build page in memory for faster refreshes
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5,
  },
};

export default nextConfig;
