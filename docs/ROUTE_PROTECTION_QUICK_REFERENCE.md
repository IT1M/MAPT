# Route Protection Quick Reference

Quick reference guide for working with the route protection system.

## Check if User Can Access a Route

```typescript
import { hasRoutePermission } from '@/utils/route-permissions'

// In a component
const canAccessAudit = hasRoutePermission(session.user.role, '/audit')

// In a conditional
if (hasRoutePermission(userRole, '/backup')) {
  // Show backup link
}
```

## Get All Routes User Can Access

```typescript
import { getAccessibleRoutes } from '@/utils/route-permissions'

const accessibleRoutes = getAccessibleRoutes('MANAGER')
// Returns: ['/dashboard', '/data-log', '/analytics', '/reports', '/backup', '/settings']
```

## Check if Route is Public

```typescript
import { isPublicRoute } from '@/utils/route-permissions'

if (isPublicRoute(pathname)) {
  // Skip authentication
}
```

## Extract Base Route from Path

```typescript
import { getBaseRoute } from '@/utils/route-permissions'

const base = getBaseRoute('/en/audit/dashboard')
// Returns: '/audit'
```

## Current Route Permissions

| Route | Roles |
|-------|-------|
| `/dashboard` | All roles |
| `/data-entry` | ADMIN, SUPERVISOR, DATA_ENTRY |
| `/data-log` | All roles |
| `/inventory` | ADMIN, SUPERVISOR, DATA_ENTRY |
| `/analytics` | ADMIN, SUPERVISOR, MANAGER, AUDITOR |
| `/reports` | ADMIN, MANAGER, SUPERVISOR, AUDITOR |
| `/backup` | ADMIN, MANAGER |
| `/audit` | ADMIN, AUDITOR |
| `/settings` | All roles |

## Add New Protected Route

1. **Add permission**:
```typescript
// src/utils/route-permissions.ts
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // ...
  '/new-route': ['ADMIN', 'MANAGER'],
}
```

2. **Add to navigation** (optional):
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

3. **Verify**:
```bash
npx tsx scripts/verify-route-protection.ts
```

## Test Route Permissions

```bash
# Run all route permission tests
npm test -- src/utils/__tests__/route-permissions.test.ts

# Run verification script
npx tsx scripts/verify-route-protection.ts
```

## Common Patterns

### Conditional Rendering Based on Permission

```typescript
import { hasRoutePermission } from '@/utils/route-permissions'
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()
  
  return (
    <>
      {hasRoutePermission(session?.user?.role, '/audit') && (
        <AuditLink />
      )}
    </>
  )
}
```

### Filter Navigation Items by Role

```typescript
import { filterNavigationByRole } from '@/config/navigation'
import { useSession } from 'next-auth/react'

function Sidebar() {
  const { data: session } = useSession()
  const navItems = filterNavigationByRole(session?.user?.role)
  
  return (
    <nav>
      {navItems.map(item => (
        <NavItem key={item.id} {...item} />
      ))}
    </nav>
  )
}
```

### Protect API Route

```typescript
// app/api/audit/route.ts
import { auth } from '@/services/auth'
import { hasRoutePermission } from '@/utils/route-permissions'

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  if (!hasRoutePermission(session.user.role, '/audit')) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // Handle request
}
```

## Troubleshooting

### User Can't Access Route

1. Check user's role: `console.log(session.user.role)`
2. Check route permissions: `console.log(ROUTE_PERMISSIONS['/route'])`
3. Verify role is in allowed list
4. Clear cookies and re-login

### Access Denied Page Missing Info

1. Check query parameters in URL
2. Verify translations exist
3. Check session is valid

### Middleware Not Running

1. Check matcher config in `src/middleware.ts`
2. Verify route not excluded
3. Check console for errors

## Related Files

- **Permissions**: `src/utils/route-permissions.ts`
- **Middleware**: `src/middleware.ts`
- **Navigation**: `src/config/navigation.ts`
- **Tests**: `src/utils/__tests__/route-permissions.test.ts`
- **Verification**: `scripts/verify-route-protection.ts`
- **Full Docs**: `docs/ROUTE_PROTECTION.md`
