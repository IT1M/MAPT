# Caching Strategy

This document outlines the caching and state management strategies implemented in the application.

## Overview

The application uses a multi-layered caching approach:

1. **SWR (stale-while-revalidate)** - API data caching
2. **localStorage** - Persistent user preferences
3. **sessionStorage** - Temporary session data
4. **Browser Cache** - Static assets (configured in next.config.js)

## SWR Data Caching

### Configuration

Default SWR configuration (`src/hooks/useApiData.ts`):

```typescript
{
  revalidateOnFocus: false,      // Don't refetch on window focus
  revalidateOnReconnect: true,   // Refetch when reconnecting
  dedupingInterval: 5000,        // Dedupe requests within 5 seconds
  errorRetryCount: 3,            // Retry failed requests 3 times
  errorRetryInterval: 5000,      // Wait 5 seconds between retries
  shouldRetryOnError: true,      // Retry on error
  revalidateIfStale: true,       // Revalidate stale data
  revalidateOnMount: true,       // Revalidate on component mount
  refreshInterval: 0,            // No auto-refresh by default
}
```

### Usage Examples

#### Basic Data Fetching

```typescript
import { useApiData } from '@/hooks/useApiData'

function UserList() {
  const { data, error, isLoading } = useApiData<User[]>('/api/users')

  if (isLoading) return <Loading />
  if (error) return <Error error={error} />
  return <UserList users={data} />
}
```

#### Custom Cache Time

```typescript
import { useApiDataWithCache } from '@/hooks/useApiData'

function Dashboard() {
  // Cache for 10 minutes
  const { data } = useApiDataWithCache('/api/dashboard', 600000)
  
  return <DashboardView data={data} />
}
```

#### Auto-Refresh

```typescript
import { useApiDataWithRefresh } from '@/hooks/useApiData'

function LiveStats() {
  // Refresh every 30 seconds
  const { data } = useApiDataWithRefresh('/api/stats', 30000)
  
  return <StatsView data={data} />
}
```

#### Pagination

```typescript
import { usePaginatedApiData } from '@/hooks/useApiData'

function InventoryTable() {
  const { data, page, nextPage, prevPage } = usePaginatedApiData(
    '/api/inventory',
    1,
    20
  )

  return (
    <>
      <Table data={data} />
      <Pagination 
        page={page}
        onNext={nextPage}
        onPrev={prevPage}
      />
    </>
  )
}
```

#### Manual Revalidation

```typescript
import { revalidateApiData } from '@/hooks/useApiData'

async function createItem(data: ItemData) {
  await fetch('/api/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  // Revalidate the inventory list
  await revalidateApiData('/api/inventory')
}
```

#### Prefetching

```typescript
import { preloadApiData } from '@/hooks/useApiData'

function Navigation() {
  return (
    <Link 
      href="/analytics"
      onMouseEnter={() => preloadApiData('/api/analytics/summary')}
    >
      Analytics
    </Link>
  )
}
```

## State Persistence

### localStorage

Used for long-term user preferences that should persist across sessions.

#### Sidebar State

```typescript
import { useSidebarState } from '@/hooks/usePersistedState'

function Layout() {
  const [collapsed, setCollapsed, toggleSidebar] = useSidebarState()

  return (
    <div>
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <Main />
    </div>
  )
}
```

#### Filter State

```typescript
import { useFilterState } from '@/hooks/usePersistedState'

function DataLog() {
  const [filters, setFilters, resetFilters] = useFilterState('inventory-filters', {
    search: '',
    category: '',
    destination: null,
  })

  return (
    <div>
      <Filters 
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />
      <Table filters={filters} />
    </div>
  )
}
```

#### Table Preferences

```typescript
import { useTablePreferences } from '@/hooks/usePersistedState'

function InventoryTable() {
  const [prefs, setPrefs] = useTablePreferences('inventory-table')

  return (
    <Table
      pageSize={prefs.pageSize}
      sortBy={prefs.sortBy}
      sortOrder={prefs.sortOrder}
      onPreferencesChange={setPrefs}
    />
  )
}
```

#### User Preferences

```typescript
import { useUserPreferences } from '@/hooks/usePersistedState'

function Settings() {
  const [prefs, updatePref] = useUserPreferences()

  return (
    <div>
      <Select
        value={prefs.density}
        onChange={(value) => updatePref('density', value)}
      >
        <option value="comfortable">Comfortable</option>
        <option value="compact">Compact</option>
        <option value="spacious">Spacious</option>
      </Select>

      <Checkbox
        checked={prefs.notifications.sound}
        onChange={(checked) => updatePref('notifications.sound', checked)}
      >
        Enable sound notifications
      </Checkbox>
    </div>
  )
}
```

### sessionStorage

Used for temporary data that should only persist during the current session.

#### Scroll Restoration

```typescript
import { useScrollRestoration } from '@/hooks/usePersistedState'

function DataLog() {
  useScrollRestoration('data-log-scroll')

  return <DataLogContent />
}
```

This automatically:
1. Saves scroll position when navigating away
2. Restores scroll position when navigating back
3. Clears on session end

## Browser Cache

### Static Assets

Configured in `next.config.js`:

```javascript
async headers() {
  return [
    // Static files - cache forever
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Images - cache for 1 hour, stale-while-revalidate for 24 hours
    {
      source: '/_next/image/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        },
      ],
    },
    // Uploads - cache forever
    {
      source: '/uploads/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ]
}
```

## Cache Invalidation

### When to Invalidate

1. **After mutations** (create, update, delete):
   ```typescript
   await createItem(data)
   revalidateApiData('/api/inventory')
   ```

2. **On user action** (manual refresh):
   ```typescript
   <Button onClick={() => revalidateApiData('/api/dashboard')}>
     Refresh
   </Button>
   ```

3. **On logout**:
   ```typescript
   import { clearAllCache } from '@/hooks/useApiData'
   import { clearPersistedState } from '@/hooks/usePersistedState'

   async function logout() {
     await signOut()
     clearAllCache()
     clearPersistedState()
     router.push('/login')
   }
   ```

### Selective Invalidation

Invalidate specific endpoints:

```typescript
// After updating a user
revalidateApiData('/api/users')
revalidateApiData(`/api/users/${userId}`)

// After creating an inventory item
revalidateApiData('/api/inventory')
revalidateApiData('/api/dashboard') // Update dashboard stats
```

## Cache Keys

### Naming Convention

Use consistent, descriptive cache keys:

```typescript
// ✅ Good
'sidebar-collapsed'
'filters-inventory'
'table-prefs-inventory'
'scroll-data-log'

// ❌ Bad
'sc'
'f1'
'prefs'
```

### Namespacing

Prefix keys by feature:

```typescript
// Filters
'filters-inventory'
'filters-analytics'
'filters-audit'

// Table preferences
'table-prefs-inventory'
'table-prefs-users'
'table-prefs-audit'

// Scroll positions
'scroll-data-log'
'scroll-analytics'
'scroll-audit'
```

## Performance Considerations

### Cache Size

Monitor localStorage usage:

```typescript
function getLocalStorageSize() {
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return (total / 1024).toFixed(2) + ' KB'
}
```

Typical limits:
- localStorage: 5-10 MB per domain
- sessionStorage: 5-10 MB per domain
- SWR cache: Memory-based, no hard limit

### Cache Cleanup

Implement periodic cleanup:

```typescript
// Clear old scroll positions (older than 1 hour)
function cleanupScrollPositions() {
  const keys = Object.keys(sessionStorage)
  const scrollKeys = keys.filter(k => k.startsWith('scroll-'))
  
  scrollKeys.forEach(key => {
    const timestamp = sessionStorage.getItem(`${key}-timestamp`)
    if (timestamp && Date.now() - parseInt(timestamp) > 3600000) {
      sessionStorage.removeItem(key)
      sessionStorage.removeItem(`${key}-timestamp`)
    }
  })
}
```

### Deduplication

SWR automatically deduplicates requests within the `dedupingInterval` (5 seconds):

```typescript
// These will only make one request
function ComponentA() {
  const { data } = useApiData('/api/users')
  return <div>{data}</div>
}

function ComponentB() {
  const { data } = useApiData('/api/users') // Uses cached data
  return <div>{data}</div>
}
```

## Best Practices

### 1. Cache Appropriate Data

✅ **Do cache**:
- User preferences
- Filter states
- Table preferences
- Dashboard summaries
- Static reference data

❌ **Don't cache**:
- Sensitive data (passwords, tokens)
- Real-time data (unless using auto-refresh)
- Large datasets (> 1MB)
- Temporary form data

### 2. Set Appropriate Cache Times

```typescript
// Static data - cache for 1 hour
useApiDataWithCache('/api/categories', 3600000)

// Dashboard - cache for 5 minutes
useApiDataWithCache('/api/dashboard', 300000)

// Real-time data - auto-refresh every 30 seconds
useApiDataWithRefresh('/api/live-stats', 30000)
```

### 3. Handle Stale Data

```typescript
const { data, isValidating } = useApiData('/api/inventory')

return (
  <div>
    {isValidating && <RefreshIndicator />}
    <Table data={data} />
  </div>
)
```

### 4. Optimize Revalidation

```typescript
// ✅ Good - revalidate related endpoints
async function updateItem(id: string, data: ItemData) {
  await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  revalidateApiData('/api/inventory')
  revalidateApiData(`/api/inventory/${id}`)
  revalidateApiData('/api/dashboard')
}

// ❌ Bad - revalidate everything
async function updateItem(id: string, data: ItemData) {
  await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  clearAllCache() // Too aggressive
}
```

### 5. Cross-Tab Synchronization

localStorage changes are automatically synced across tabs:

```typescript
// Tab 1: User collapses sidebar
setSidebarCollapsed(true)

// Tab 2: Sidebar automatically collapses
// (handled by storage event listener in usePersistedState)
```

## Troubleshooting

### Cache Not Updating

1. Check if revalidation is called after mutations
2. Verify cache key matches exactly
3. Check network tab for actual requests
4. Clear cache manually: `clearAllCache()`

### Data Not Persisting

1. Check localStorage quota (5-10 MB limit)
2. Verify JSON serialization works
3. Check for private browsing mode
4. Look for localStorage errors in console

### Stale Data

1. Reduce cache time
2. Enable auto-refresh
3. Add manual refresh button
4. Use optimistic updates

## Resources

- [SWR Documentation](https://swr.vercel.app/)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
