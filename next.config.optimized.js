/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Internationalization
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      }

      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Settings components chunk
          settings: {
            name: 'settings',
            test: /[\\/]src[\\/]components[\\/]settings[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Analytics components chunk
          analytics: {
            name: 'analytics',
            test: /[\\/]src[\\/]components[\\/]analytics[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      }
    }

    return config
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      'recharts',
      'react-window',
      '@react-pdf/renderer',
    ],
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Compress responses
  compress: true,

  // Power by header
  poweredByHeader: false,

  // Generate ETags
  generateEtags: true,

  // Production source maps (optional, disable for smaller builds)
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
