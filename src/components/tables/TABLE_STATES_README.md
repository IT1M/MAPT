# Table State Components

Reusable components for displaying different table states (loading, empty, error).

## Components

### TableLoadingState

A skeleton loader that matches the table structure for a smooth loading experience.

#### Features

- Animated skeleton rows
- Configurable number of columns and rows
- Optional selection checkbox column
- Matches table styling

#### Usage

```tsx
import { TableLoadingState } from '@/components/tables';

function MyTable() {
  const { data, isLoading } = useData();

  if (isLoading) {
    return <TableLoadingState columns={10} rows={5} hasSelection={true} />;
  }

  return <ActualTable data={data} />;
}
```

#### Props

| Prop           | Type      | Default  | Description                    |
| -------------- | --------- | -------- | ------------------------------ |
| `columns`      | `number`  | Required | Number of columns to display   |
| `rows`         | `number`  | `5`      | Number of skeleton rows        |
| `hasSelection` | `boolean` | `false`  | Show selection checkbox column |
| `className`    | `string`  | `''`     | Additional CSS classes         |

---

### TableEmptyState

A friendly empty state with optional action button.

#### Features

- Customizable icon, title, and description
- Optional call-to-action button
- Centered layout with proper spacing

#### Usage

```tsx
import { TableEmptyState } from '@/components/tables';

function MyTable() {
  const { data } = useData();

  if (data.length === 0) {
    return (
      <TableEmptyState
        title="No inventory items found"
        description="Try adjusting your filters or add a new item."
        action={{
          label: 'Add Item',
          onClick: () => openAddModal(),
        }}
      />
    );
  }

  return <ActualTable data={data} />;
}
```

#### Props

| Prop          | Type                                     | Default                           | Description            |
| ------------- | ---------------------------------------- | --------------------------------- | ---------------------- |
| `title`       | `string`                                 | `'No data found'`                 | Main heading text      |
| `description` | `string`                                 | `'No inventory entries found...'` | Description text       |
| `icon`        | `React.ReactNode`                        | Document icon                     | Custom icon element    |
| `action`      | `{ label: string, onClick: () => void }` | `undefined`                       | Optional action button |
| `className`   | `string`                                 | `''`                              | Additional CSS classes |

---

### TableErrorState

An error state with retry functionality.

#### Features

- Error icon and message display
- Optional retry button
- Displays error details
- User-friendly error messages

#### Usage

```tsx
import { TableErrorState } from '@/components/tables';

function MyTable() {
  const { data, error, refetch } = useData();

  if (error) {
    return (
      <TableErrorState
        title="Failed to load inventory"
        error={error}
        onRetry={refetch}
      />
    );
  }

  return <ActualTable data={data} />;
}
```

#### Props

| Prop        | Type            | Default                 | Description                               |
| ----------- | --------------- | ----------------------- | ----------------------------------------- |
| `title`     | `string`        | `'Failed to load data'` | Error heading                             |
| `message`   | `string`        | `undefined`             | Custom error message                      |
| `error`     | `Error \| null` | `undefined`             | Error object (message will be extracted)  |
| `onRetry`   | `() => void`    | `undefined`             | Retry callback (shows button if provided) |
| `className` | `string`        | `''`                    | Additional CSS classes                    |

---

## Complete Example

```tsx
import {
  TableLoadingState,
  TableEmptyState,
  TableErrorState,
  InventoryTable,
} from '@/components/tables';

function DataLogPage() {
  const { data, isLoading, error, refetch } = useInventoryData();

  // Loading state
  if (isLoading) {
    return <TableLoadingState columns={10} rows={10} hasSelection={true} />;
  }

  // Error state
  if (error) {
    return (
      <TableErrorState
        title="Failed to load inventory data"
        error={error}
        onRetry={refetch}
      />
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <TableEmptyState
        title="No inventory items"
        description="Start by adding your first inventory item."
        action={{
          label: 'Add First Item',
          onClick: () => router.push('/data-entry'),
        }}
      />
    );
  }

  // Success state
  return (
    <InventoryTable
      items={data}
      // ... other props
    />
  );
}
```

## Styling

All components:

- Support dark mode
- Use consistent spacing and typography
- Match the application's design system
- Are fully responsive
- Include proper accessibility attributes

## Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader friendly
- Focus management
