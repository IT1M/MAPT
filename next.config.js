/** @type {import('next').NextConfig} */
// Removed next-intl to simplify routing and fix webpack errors
// const withNextIntl = require('next-intl/plugin')('./src/i18n.ts')

const nextConfig = {
  reactStrictMode: true,
  
  // Set English as the only locale
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  
  // Production optimizations (Task 4.1)
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Image optimization (Task 4.2)
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  experimental: {
    serverActions: {
      enabled: true
    },
    // Optimize package imports for large libraries (Task 8.1)
    optimizePackageImports: [
      'recharts',
      'react-icons',
      '@prisma/client',
      'date-fns',
    ],
  },
  
  // Production optimizations for code splitting (Task 8.1)
  productionBrowserSourceMaps: false,
  
  // Optimize chunks for better caching (Task 8.1)
  webpack: (config, { isServer, dev }) => {
    // Exclude bcrypt from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    // Only externalize bcrypt on server-side
    if (isServer) {
      config.externals = [...(config.externals || []), 'bcrypt']
    }
    
    // Optimize chunk splitting in production (Task 8.1)
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks for better caching
            default: false,
            vendors: false,
            // Framework chunk (React, Next.js)
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Common libraries chunk
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `npm.${packageName?.replace('@', '')}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Charts library chunk (heavy dependency)
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|d3-.*?)[\\/]/,
              priority: 35,
              reuseExistingChunk: true,
            },
            // Common components chunk
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config
  },
  
  // Security and caching headers (Task 4.3, 8.3)
  async headers() {
    return [
      // Static assets caching (Task 8.3)
      {
        source: '/uploads/:path*',
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
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          },
        ],
      },
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://generativelanguage.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ],
      },
    ]
  },
  
  // Redirects removed - home page is now at /
}

module.exports = nextConfig
