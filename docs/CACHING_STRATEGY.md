# Caching Strategy

This document outlines the caching strategies implemented in the Saudi Mais Inventory Management Application.

## Overview

The application uses a multi-layered caching approach:

1. **Browser Cache**: Client-side caching for static assets
2. **CDN Cache**: Vercel Edge Network caching for API responses
3. **Memory Cache**: Server-side in-memory caching for expensive operations
4. **Database Query Cache**: Prisma query result caching

## Cache Layers

### 1. Static Assets (Browser + CDN)

Static assets are cached with long TTL for optimal performance.

#### Configuration
```javascript
// next.config.js
{
  source: '/_next/static/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    },
  ],
}
```

#### Assets Covered
- JavaScript bundles
- CSS files
- Images (via Next.js Image)
- Fonts
- Public uploads

### 2. API Response Caching

API responses are cached based on route patterns and data volatility.

#### Cache TTL by Route

| Route Pattern | TTL | Reason |
|--------------|-----|--------|
| `/api/products` | 1 hour | Static product data |
| `/api/settings` | 5 minutes | Settings change infrequently |
| `/api/analytics/*` | 5 minutes | Analytics can be slightly stale |
| `/api/dashboard` | 5 minutes | Dashboard data updates frequently |
| `/api/reports` | 15 minutes | Reports are expensive to generate |
| `/api/inventory` | 1 minute | Inventory changes frequently |
| `/api/auth/*` | No cache | Authentication must be fresh |
| `/api/backup/*` | No cache | Backup operations are critical |
| `/api/audit/*` | No cache | Audit logs must be accurate |

#### Implementation

```typescript
import { CACHE_CONTROL, getCacheHeaders } from '@/utils/cache';

export async function GET(request: Request) {
  const data = await fetchData();
  
  return Response.json(data, {
    headers: getCacheHeaders(CACHE_CONTROL.MEDIUM),
  });
}
```

### 3. Stale-While-Revalidate

The application uses `stale-while-revalidate` for better user experience:

```
Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=600
```

This means:
- Cache is fresh for 5 minutes
- After 5 minutes, serve stale content while fetching fresh data
- Stale content can be served for up to 10 minutes

### 4. In-Memory Cache

Server-side memory cache for expensive operations:

```typescript
import { withCache, CACHE_TTL } from '@/utils/cache';

const data = await withCache(
  'analytics:summary',
  CACHE_TTL.MEDIUM,
  async () => {
    // Expensive operation
    return await calculateAnalytics();
  }
);
```

#### Use Cases
- Complex analytics calculations
- Aggregated reports
- AI-generated insights
- Database query results

### 5. Database Query Caching

Prisma doesn't have built-in query caching, but we can implement it:

```typescript
import { memoryCache, CACHE_TTL } from '@/utils/cache';

async function getProducts() {
  const cacheKey = 'products:all';
  const cached = memoryCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const products = await prisma.product.findMany();
  memoryCache.set(cacheKey, products, CACHE_TTL.HOUR);
  
  return products;
}
```

## Cache Invalidation

### Manual Invalidation

Invalidate cache when data changes:

```typescript
import { invalidateCachePattern } from '@/utils/cache';

// After updating inventory
await prisma.inventoryItem.update({ ... });
invalidateCachePattern('inventory:');
```

### Automatic Invalidation

Cache automatically expires based on TTL. No manual intervention needed.

### Revalidation

Use Next.js revalidation for static pages:

```typescript
// app/[locale]/dashboard/page.tsx
export const revalidate = 300; // Revalidate every 5 minutes
```

## Best Practices

### 1. Cache Read-Heavy Operations

✅ **Do cache:**
- Analytics summaries
- Report lists
- Product catalogs
- Settings

❌ **Don't cache:**
- Authentication responses
- Real-time inventory updates
- Audit logs
- Backup operations

### 2. Use Appropriate TTL

- **Short (1 min)**: Frequently changing data (inventory)
- **Medium (5 min)**: Moderately changing data (analytics)
- **Long (15 min)**: Slowly changing data (reports)
- **Hour**: Static data (products, settings)
- **Day**: Rarely changing data (system config)

### 3. Implement Cache Warming

Pre-populate cache for common queries:

```typescript
// On application startup
async function warmCache() {
  await getProducts(); // Populates cache
  await getSettings(); // Populates cache
}
```

### 4. Monitor Cache Hit Rate

Track cache effectiveness:

```typescript
let hits = 0;
let misses = 0;

function getCacheStats() {
  const total = hits + misses;
  const hitRate = total > 0 ? (hits / total) * 100 : 0;
  return { hits, misses, hitRate };
}
```

### 5. Handle Cache Failures Gracefully

Always have a fallback:

```typescript
async function getData() {
  try {
    const cached = memoryCache.get('key');
    if (cached) return cached;
  } catch (error) {
    console.error('Cache error:', error);
  }
  
  // Fallback to database
  return await fetchFromDatabase();
}
```

## CDN Caching (Vercel)

Vercel Edge Network automatically caches responses based on `Cache-Control` headers.

### Edge Caching

```typescript
// Cached at the edge
export async function GET() {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

### Bypass Edge Cache

```typescript
// Not cached at the edge
export async function GET() {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'private, no-cache',
    },
  });
}
```

## Testing Cache

### Test Cache Headers

```bash
# Check cache headers
curl -I https://your-domain.com/api/products

# Expected output:
# Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200
```

### Test Cache Hit

```bash
# First request (cache miss)
curl -w "%{time_total}\n" https://your-domain.com/api/products

# Second request (cache hit - should be faster)
curl -w "%{time_total}\n" https://your-domain.com/api/products
```

## Monitoring

Monitor cache performance in production:

```typescript
import { logger } from '@/services/logger';

function logCacheMetrics() {
  const stats = getCacheStats();
  logger.info('Cache metrics', {
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${stats.hitRate.toFixed(2)}%`,
  });
}

// Log every hour
setInterval(logCacheMetrics, 3600000);
```

## Troubleshooting

### Issue: Cache not working

**Check:**
1. Cache-Control headers are set correctly
2. Request method is GET (POST/PUT/DELETE are not cached)
3. No authentication headers (authenticated requests may not be cached)

### Issue: Stale data

**Solutions:**
1. Reduce TTL
2. Implement cache invalidation
3. Use shorter stale-while-revalidate window

### Issue: High memory usage

**Solutions:**
1. Reduce cache TTL
2. Implement cache size limits
3. Run cleanup more frequently
4. Consider Redis for production

## Future Improvements

1. **Redis Integration**: Replace in-memory cache with Redis for distributed caching
2. **Cache Warming**: Implement automatic cache warming on deployment
3. **Cache Analytics**: Track cache hit rates and optimize TTL
4. **Conditional Requests**: Implement ETag-based conditional requests
5. **Service Worker**: Add service worker for offline caching
