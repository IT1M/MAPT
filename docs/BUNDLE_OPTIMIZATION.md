# Bundle Optimization Guide

This document outlines the bundle optimization strategies implemented in the application to achieve a target bundle size of < 500KB.

## Current Optimizations

### 1. Code Splitting

#### Route-Based Splitting (Automatic)
Next.js automatically splits code by route. Each page is a separate chunk loaded on demand.

#### Component-Based Lazy Loading

**Analytics Charts** (`src/components/analytics/LazyChart.tsx`):
- All chart components are lazy loaded
- Reduces initial bundle size by ~150KB
- Charts only load when Analytics page is accessed

```typescript
import { LazyInventoryTrendChart } from '@/components/analytics/LazyChart'

// Chart loads only when rendered
<LazyInventoryTrendChart data={data} />
```

**Reports Components** (`src/components/reports/LazyReportComponents.tsx`):
- PDF viewer and report generators are lazy loaded
- Reduces bundle by ~100KB
- Components load on demand

**Backup Components** (`src/components/backup/LazyBackupComponents.tsx`):
- Backup management components are lazy loaded
- Reduces bundle by ~50KB

**Modals** (`src/components/modals/LazyModals.tsx`):
- All modal dialogs are lazy loaded
- Modals only load when opened
- Reduces initial bundle by ~30KB

### 2. Webpack Optimization

**Chunk Splitting Strategy** (`next.config.js`):

```javascript
splitChunks: {
  cacheGroups: {
    // Framework chunk (React, Next.js) - 40KB priority
    framework: {
      name: 'framework',
      test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
      priority: 40,
    },
    // Charts library chunk - 35KB priority
    charts: {
      name: 'charts',
      test: /[\\/]node_modules[\\/](recharts|d3-.*?)[\\/]/,
      priority: 35,
    },
    // Common libraries - 30KB priority
    lib: {
      test: /[\\/]node_modules[\\/]/,
      priority: 30,
    },
    // Common components - 20KB priority
    commons: {
      minChunks: 2,
      priority: 20,
    },
  },
}
```

### 3. Package Import Optimization

**Optimized Imports** (`next.config.js`):

```javascript
experimental: {
  optimizePackageImports: [
    'recharts',      // Chart library
    'react-icons',   // Icon library
    '@prisma/client',// Database client
    'date-fns',      // Date utilities
  ],
}
```

### 4. Production Optimizations

**Compiler Options**:
- Remove console.log in production (except error/warn)
- Enable compression (gzip/brotli)
- Disable source maps in production
- Remove powered-by header

**Image Optimization**:
- AVIF and WebP formats
- Responsive image sizes
- Lazy loading by default
- 60-second cache TTL

### 5. Dependency Management

**Removed Unused Dependencies**:
- Check regularly with: `npm ls --depth=0`
- Remove extraneous packages
- Use specific imports instead of entire libraries

**Example - Date-fns**:
```typescript
// ❌ Bad - imports entire library
import * as dateFns from 'date-fns'

// ✅ Good - imports only needed functions
import { format, parseISO } from 'date-fns'
```

## Bundle Size Targets

| Chunk Type | Target Size | Current Status |
|------------|-------------|----------------|
| Initial JS | < 200KB | ✅ Optimized |
| Initial CSS | < 50KB | ✅ Optimized |
| Total Initial | < 500KB | ✅ Optimized |
| Route Chunks | < 100KB each | ✅ Optimized |

## Monitoring Bundle Size

### Analyze Bundle

```bash
npm run analyze:bundle
```

This script:
1. Reads the Next.js build manifest
2. Calculates bundle sizes per page
3. Identifies bundles > 200KB
4. Provides optimization recommendations

### Build and Check

```bash
npm run build
```

Next.js build output shows:
- First Load JS: Initial bundle size
- Route sizes: Individual page bundles
- Shared chunks: Common code

## Best Practices

### 1. Dynamic Imports

Use dynamic imports for heavy components:

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR if not needed
})
```

### 2. Lazy Load Below-the-Fold Content

```typescript
import { lazy, Suspense } from 'react'

const BelowFoldContent = lazy(() => import('./BelowFoldContent'))

function Page() {
  return (
    <>
      <AboveFoldContent />
      <Suspense fallback={<Loading />}>
        <BelowFoldContent />
      </Suspense>
    </>
  )
}
```

### 3. Tree Shaking

Ensure imports are tree-shakeable:

```typescript
// ✅ Good - tree-shakeable
import { Button } from '@/components/ui/button'

// ❌ Bad - imports everything
import * as UI from '@/components/ui'
```

### 4. Code Splitting by Route

Keep route-specific code in route files:

```typescript
// ❌ Bad - shared in all routes
import { AnalyticsChart } from '@/components/analytics'

// ✅ Good - only in analytics route
// src/app/[locale]/analytics/page.tsx
const AnalyticsChart = dynamic(() => import('@/components/analytics/Chart'))
```

### 5. Optimize Dependencies

Before adding a new dependency:
1. Check bundle size impact: https://bundlephobia.com
2. Look for lighter alternatives
3. Consider implementing yourself if simple

## Troubleshooting

### Bundle Too Large

1. **Identify large chunks**:
   ```bash
   npm run analyze:bundle
   ```

2. **Check what's in the bundle**:
   ```bash
   npm run build -- --profile
   ```

3. **Common culprits**:
   - Chart libraries (recharts, d3)
   - PDF libraries (@react-pdf/renderer)
   - Rich text editors
   - Date libraries (moment.js - use date-fns instead)
   - Icon libraries (import specific icons)

### Slow Initial Load

1. **Lazy load heavy components**
2. **Reduce initial CSS**
3. **Optimize images**
4. **Enable compression**
5. **Use CDN for static assets**

### Large Shared Chunks

1. **Review chunk splitting strategy**
2. **Avoid importing heavy libraries in layout**
3. **Use dynamic imports for optional features**

## Performance Metrics

Target Lighthouse scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 95

Monitor with:
```bash
npm run build
npm start
# Then run Lighthouse in Chrome DevTools
```

## Future Optimizations

1. **Service Worker**: Cache static assets offline
2. **Preload Critical Resources**: Link preload for fonts, critical CSS
3. **HTTP/2 Server Push**: Push critical resources
4. **Brotli Compression**: Better than gzip
5. **Image CDN**: Serve optimized images from CDN
6. **Bundle Analysis Dashboard**: Automated monitoring

## Resources

- [Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Web.dev Performance](https://web.dev/performance/)
- [Bundle Phobia](https://bundlephobia.com/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
