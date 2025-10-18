# Route Protection System

This document describes the route protection and authorization system implemented in the application.

## Overview

The application uses a comprehensive route protection system that ensures:
1. **Authentication**: All protected routes require a valid user session
2. **Authorization**: Users can only access routes they have permission for based on their role
3. **Session Management**: Expired sessions are handled gracefully with redirects
4. **Access Denied Handling**: Clear feedback when users lack permissions

## Architecture

### Components

1. **Middleware** (`src/middleware.ts`)
   - Intercepts all requests before they reach page components
   - Checks authentication status
   - Verifies role-based permissions
   - Redirects unauthorized users appropriately

2. **Route Permissions Utility** (`src/utils/route-permissions.ts`)
   - Centralized permission configuration
   - Reusable permission checking functions
   - Type-safe role definitions

3. **Access Denied Page** (`src/app/[locale]/access-denied/`)
   - User-friendly error page for authorization failures
   - Shows user's current role and required permissions
   - Provides navigation options

## Route Permissions

### Permission Matrix

| Route | ADMIN | MANAGER | SUPERVISOR | DATA_ENTRY | AUDITOR |
|-------|-------|---------|------------|------------|---------|
| `/dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/data-entry` | ✓ | ✗ | ✓ | ✓ | ✗ |
| `/data-log` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/inventory` | ✓ | ✗ | ✓ | ✓ | ✗ |
| `/analytics` | ✓ | ✓ | ✓ | ✗ | ✓ |
| `/reports` | ✓ | ✓ | ✓ | ✗ | ✓ |
| `/backup` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `/audit` | ✓ | ✗ | ✗ | ✗ | ✓ |
| `/settings` | ✓ | ✓ | ✓ | ✓ | ✓ |

### Configuration

Route permissions are defined in `src/utils/route-permissions.ts`:

```typescript
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/data-entry': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
  '/data-log': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/inventory': ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
  '/analytics': ['ADMIN', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  '/reports': ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AUDITOR'],
  '/backup': ['ADMIN', 'MANAGER'],
  '/audit': ['ADMIN', 'AUDITOR'],
  '/settings': ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
}
```

## Authentication Flow

### 1. Unauthenticated User

```
User → Protected Route → Middleware
                           ↓
                    No Session Found
                           ↓
                  Redirect to /login
                  (with callbackUrl)
```

### 2. Authenticated User with Permission

```
User → Protected Route → Middleware
                           ↓
                    Session Valid
                           ↓
                  Check Role Permission
                           ↓
                    Permission Granted
                           ↓
                    Render Page
```

### 3. Authenticated User without Permission

```
User → Protected Route → Middleware
                           ↓
                    Session Valid
                           ↓
                  Check Role Permission
                           ↓
                  Permission Denied
                           ↓
              Redirect to /access-denied
              (with context params)
```

## Session Expiration Handling

When a user's session expires:

1. Middleware detects missing/invalid session
2. User is redirected to login page
3. Original URL is preserved in `callbackUrl` parameter
4. After successful login, user is redirected back to original page
5. Login page shows "session expired" message

Example redirect:
```
/en/dashboard → /en/login?callbackUrl=/en/dashboard&reason=session_required
```

## Access Denied Page

The access denied page (`/access-denied`) provides:

- **Clear Error Message**: Explains why access was denied
- **User Context**: Shows current user and their role
- **Required Permissions**: Displays what role is needed (if available)
- **Attempted Path**: Shows which page they tried to access
- **Navigation Options**:
  - Go Back button
  - Go to Dashboard button
  - Contact Administrator link

### Query Parameters

The access denied page accepts these query parameters:

- `path`: The full path the user attempted to access
- `route`: The base route (e.g., `/audit`)
- `role`: The required role (optional)

Example:
```
/en/access-denied?path=/en/audit/dashboard&route=/audit
```

## Utility Functions

### `hasRoutePermission(userRole, route)`

Check if a user role has permission to access a route.

```typescript
import { hasRoutePermission } from '@/utils/route-permissions'

if (hasRoutePermission('DATA_ENTRY', '/dashboard')) {
  // User can access dashboard
}
```

### `getAccessibleRoutes(userRole)`

Get all routes a user role can access.

```typescript
import { getAccessibleRoutes } from '@/utils/route-permissions'

const routes = getAccessibleRoutes('AUDITOR')
// Returns: ['/dashboard', '/data-log', '/analytics', '/reports', '/audit', '/settings']
```

### `isPublicRoute(pathname)`

Check if a route is public (doesn't require authentication).

```typescript
import { isPublicRoute } from '@/utils/route-permissions'

if (isPublicRoute('/en/login')) {
  // This is a public route
}
```

### `getBaseRoute(pathname)`

Extract the base route from a full pathname.

```typescript
import { getBaseRoute } from '@/utils/route-permissions'

const base = getBaseRoute('/en/audit/dashboard')
// Returns: '/audit'
```

## Testing

Comprehensive tests are available in `src/utils/__tests__/route-permissions.test.ts`.

Run tests:
```bash
npm test -- src/utils/__tests__/route-permissions.test.ts
```

Test coverage includes:
- Public route identification
- Base route extraction
- Permission checking for all roles
- Edge cases and error conditions
- Configuration validation

## Adding New Routes

To add a new protected route:

1. **Add to Route Permissions**:
   ```typescript
   // src/utils/route-permissions.ts
   export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
     // ... existing routes
     '/new-route': ['ADMIN', 'MANAGER'], // Add your route
   }
   ```

2. **Add to Navigation Config** (if it should appear in sidebar):
   ```typescript
   // src/config/navigation.ts
   {
     id: 'new-route',
     label: { en: 'New Route', ar: 'مسار جديد' },
     icon: YourIcon,
     href: '/new-route',
     roles: ['ADMIN', 'MANAGER'],
   }
   ```

3. **Add Tests**:
   ```typescript
   // src/utils/__tests__/route-permissions.test.ts
   it('should allow ADMIN to access new route', () => {
     expect(hasRoutePermission('ADMIN', '/new-route')).toBe(true)
   })
   ```

4. **Update Documentation**: Add the route to the permission matrix above

## Security Considerations

1. **Defense in Depth**: Route protection is enforced at multiple levels:
   - Middleware (primary)
   - API routes (secondary)
   - Component-level checks (tertiary)

2. **Default Deny**: Routes not in the permissions map are allowed by default, but this should be changed to deny by default in production

3. **Session Validation**: Sessions are validated on every request

4. **CSRF Protection**: Implemented via NextAuth

5. **Type Safety**: TypeScript ensures role types are consistent

## Troubleshooting

### User Can't Access a Route They Should Have Access To

1. Check the user's role in the database
2. Verify the route is in `ROUTE_PERMISSIONS`
3. Ensure the user's role is in the allowed roles array
4. Check for typos in route paths (case-sensitive)
5. Clear browser cookies and re-login

### Access Denied Page Not Showing Context

1. Verify query parameters are being passed in the redirect
2. Check translation keys exist in `messages/en.json` and `messages/ar.json`
3. Ensure session is valid when accessing the page

### Middleware Not Running

1. Check the `matcher` configuration in `src/middleware.ts`
2. Verify the route is not excluded by the matcher pattern
3. Check for errors in the middleware console logs

## Related Documentation

- [Navigation System](./NAVIGATION.md)
- [Authentication](./AUTHENTICATION.md)
- [User Roles and Permissions](./ROLES_AND_PERMISSIONS.md)
