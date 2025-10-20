# Loading and Empty States Usage Guide

This guide demonstrates how to use the loading and empty state components created for the app navigation integration.

## Loading Components

### PageLoader

Full-screen loader with company logo and progress bar. Use for page-level loading states.

```tsx
import { PageLoader } from '@/components/ui';

// Basic usage
<PageLoader />

// With message
<PageLoader message="Loading dashboard..." />

// With progress
<PageLoader message="Generating report..." progress={45} />

// With timeout handling
<PageLoader
  message="Loading data..."
  timeout={3000}
  onTimeout={() => console.log('Loading timeout')}
/>
```

### InlineLoader

Smaller loader for inline sections or components.

```tsx
import { InlineLoader } from '@/components/ui';

// Small size
<InlineLoader size="sm" />

// Medium with message
<InlineLoader size="md" message="Loading..." />

// Large
<InlineLoader size="lg" message="Processing data..." />
```

### Skeleton Loaders

Use skeleton loaders to show content structure while data loads.

```tsx
import {
  SkeletonTable,
  SkeletonCard,
  SkeletonForm,
  SkeletonStats,
  SkeletonList,
  SkeletonPage
} from '@/components/ui';

// Table skeleton
<SkeletonTable rows={10} columns={6} />

// Card skeleton
<SkeletonCard hasHeader hasFooter lines={5} />

// Form skeleton
<SkeletonForm fields={6} hasSubmitButton />

// Stats cards skeleton
<SkeletonStats count={4} />

// List skeleton
<SkeletonList items={8} hasAvatar />

// Full page skeleton
<SkeletonPage hasHeader hasSidebar />
```

### Chart Skeletons

Specialized skeletons for different chart types.

```tsx
import { ChartSkeleton, ChartsGridSkeleton } from '@/components/ui';

// Single chart
<ChartSkeleton type="bar" height={300} showLegend showTitle />
<ChartSkeleton type="line" height={250} />
<ChartSkeleton type="pie" height={300} />
<ChartSkeleton type="area" height={280} />

// Multiple charts grid
<ChartsGridSkeleton count={4} columns={2} />
```

## Empty State Components

### EmptyState

Generic empty state component with customizable icon, title, description, and action.

```tsx
import { EmptyState } from '@/components/ui';
import { useTranslations } from 'next-intl';

const t = useTranslations('emptyState.dataLog');

// Basic usage with illustration
<EmptyState
  illustration="no-data"
  title={t('title')}
  description={t('description')}
  action={{
    label: t('action'),
    href: '/data-entry'
  }}
/>

// With custom icon
<EmptyState
  icon={<CustomIcon />}
  title="Custom Empty State"
  description="This is a custom empty state"
/>

// With onClick action
<EmptyState
  illustration="no-results"
  title="No results found"
  action={{
    label: "Reset Filters",
    onClick: handleResetFilters
  }}
/>
```

### Illustration Types

- `no-data`: For when no data exists yet (first-time users)
- `no-results`: For when filters/search return no results
- `no-access`: For permission denied scenarios
- `error`: For error states

### TableEmptyState

Specialized empty state for tables with filter awareness.

```tsx
import { TableEmptyState } from '@/components/ui';

// No data state
<TableEmptyState
  title="No inventory items"
  description="Start by adding your first item"
  action={{
    label: "Add Item",
    href: "/data-entry"
  }}
/>

// No results with filters
<TableEmptyState
  hasFilters
  onResetFilters={handleResetFilters}
/>
```

### NotificationsEmptyState

Pre-configured empty state for notifications.

```tsx
import { NotificationsEmptyState } from '@/components/ui';

<NotificationsEmptyState />;
```

### SearchEmptyState

Empty state for search results.

```tsx
import { SearchEmptyState } from '@/components/ui';

<SearchEmptyState searchQuery={searchTerm} onClearSearch={handleClearSearch} />;
```

### ErrorEmptyState

Empty state for error scenarios.

```tsx
import { ErrorEmptyState } from '@/components/ui';

<ErrorEmptyState
  title="Failed to load data"
  description="We couldn't load the data. Please try again."
  onRetry={handleRetry}
/>;
```

## Complete Page Example

Here's a complete example showing how to use loading and empty states in a page:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  PageLoader,
  SkeletonTable,
  TableEmptyState,
  ErrorEmptyState,
} from '@/components/ui';

export default function DataLogPage() {
  const t = useTranslations('dataLog');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [hasFilters, setHasFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/inventory');
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Initial page load
  if (loading && data.length === 0) {
    return <PageLoader message={t('loadingData')} />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <ErrorEmptyState
          title={t('common.failedToLoad')}
          description={error.message}
          onRetry={fetchData}
        />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="p-8">
        <TableEmptyState
          title={t('emptyState.dataLog.title')}
          description={t('emptyState.dataLog.description')}
          action={{
            label: t('emptyState.dataLog.action'),
            href: '/data-entry',
          }}
          hasFilters={hasFilters}
          onResetFilters={() => setHasFilters(false)}
        />
      </div>
    );
  }

  // Data loaded - show table
  return (
    <div className="p-8">
      {loading ? (
        <SkeletonTable rows={10} columns={6} />
      ) : (
        <DataTable data={data} />
      )}
    </div>
  );
}
```

## Button Loading State

The Button component already supports loading state:

```tsx
import { Button } from '@/components/ui';

<Button loading={isSubmitting} onClick={handleSubmit}>
  Submit
</Button>;
```

## Best Practices

1. **Use PageLoader for initial page loads** - Shows full-screen loader with company branding
2. **Use Skeleton loaders for subsequent loads** - Better UX as users can see the structure
3. **Match skeleton to actual content** - Use SkeletonTable for tables, SkeletonCard for cards, etc.
4. **Provide helpful empty states** - Always include a clear action for users to take
5. **Handle timeouts** - Use the timeout prop on PageLoader for long-running operations
6. **Localize all text** - Use translation keys for all user-facing text
7. **Consider filter state** - Use TableEmptyState with hasFilters for better UX

## Translation Keys

Make sure to use the following translation keys:

```json
{
  "emptyState": {
    "dataLog": { "title": "...", "description": "...", "action": "..." },
    "analytics": { "title": "...", "description": "..." },
    "audit": { "title": "...", "description": "...", "action": "..." },
    "backup": { "title": "...", "description": "...", "action": "..." },
    "reports": { "title": "...", "description": "...", "action": "..." },
    "noResults": { "title": "...", "description": "...", "action": "..." },
    "noAccess": { "title": "...", "description": "...", "action": "..." },
    "error": { "title": "...", "description": "...", "action": "..." },
    "search": { "title": "...", "description": "...", "action": "..." }
  },
  "loading": {
    "page": "Loading page...",
    "data": "Loading data...",
    "processing": "Processing...",
    "generating": "Generating...",
    "timeout": "This is taking longer than expected...",
    "retry": "Retry"
  }
}
```

These translations are already added to both `messages/en.json` and `messages/ar.json`.
