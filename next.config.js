/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts')

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      enabled: true
    }
  },
  webpack: (config, { isServer }) => {
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
    
    // Ignore node-pre-gyp issues
    config.externals = [...(config.externals || []), 'bcrypt']
    
    return config
  }
}

module.exports = withNextIntl(nextConfig)
