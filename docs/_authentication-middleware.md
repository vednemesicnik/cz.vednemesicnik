# Authentication Middleware

## Overview

This document describes the authentication architecture in the application and provides a future implementation plan for migrating from loader-based authentication to React Router v8 middleware.

## Current Implementation

### Current Approach: Loader-Based Authentication

The application currently uses a **loader-based authentication pattern** where each protected route explicitly calls a guard in its loader/action. There are two specialized guards: `requireAuthentication({ request, url })` for route loaders/actions (it uses React Router's normalized `url` arg to preserve `redirectTo`), and `requireSession(request)` for bare-`Request` callers behind the authenticated layout (e.g. permission-context helpers) that don't need a return path.

```typescript
// app/routes/administration/__layout-authenticated/_loader.ts
import { requireAuthentication } from '~/utils/auth.server'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  // Must call the guard in every protected loader
  const { isAuthenticated, sessionId } = await requireAuthentication({
    request,
    url,
  })

  // ... rest of loader logic
}
```

### Authentication Utility

```typescript
// app/utils/auth.server.ts
// Route-level guard: preserves where the user was headed via redirectTo.
export const requireAuthentication = async ({
  request,
  url,
}: {
  request: Request
  url: URL
}) => {
  const { cookieSession, session } = await loadSession(request)

  if (session === null) {
    throw await redirectToSignIn(cookieSession, url.pathname + url.search)
  }

  return {
    isAuthenticated: true,
    sessionId: session.id,
  }
}

// Minimal guard for bare-Request callers (no redirectTo).
export const requireSession = async (request: Request) => {
  const { cookieSession, session } = await loadSession(request)

  if (session === null) {
    throw await redirectToSignIn(cookieSession)
  }

  return {
    isAuthenticated: true,
    sessionId: session.id,
  }
}
```

### Current Characteristics

✅ **Explicit** - Each loader clearly shows it requires authentication
✅ **Flexible** - Easy to add authentication to individual routes
✅ **Simple** - No additional configuration needed

❌ **Repetitive** - `requireAuthentication` must be called in every protected loader
❌ **Error-prone** - Easy to forget authentication check in new routes
❌ **Duplication** - Session fetching logic duplicated across loaders
❌ **Performance Issue** - Multiple database queries per request (N loaders = N queries)

## Future Implementation: Middleware Pattern

### Why Middleware?

React Router v8 provides **middleware** - functions that run before and after route handlers. Middleware is ideal for cross-cutting concerns like authentication.

### Benefits of Middleware

✅ **DRY Principle** - Authentication logic in one place
✅ **Type-safe Context** - Share authenticated session across child routes
✅ **Automatic Protection** - All child routes automatically protected
✅ **Cleaner Loaders** - Loaders focus only on data fetching
✅ **Centralized Logic** - Easier to maintain and update auth logic
✅ **Performance** - Single database query per request instead of N queries

### Performance Comparison: Database Queries

One of the most significant benefits of middleware is **eliminating redundant database queries**.

#### Current Approach: Multiple DB Queries

With the loader-based approach, **each loader that calls `requireAuthentication` makes a separate database query**:

```
Request: GET /administration/users

Route tree execution:
├── __layout (loader)
│   └── requireAuthentication → DB query #1 ❌
├── __layout-authenticated (loader)
│   └── requireAuthentication → DB query #2 ❌
└── users/_index (loader)
    └── requireAuthentication → DB query #3 ❌

Total: 3 database queries for authentication alone
```

**Example code:**

```typescript
// app/routes/administration/__layout-authenticated/_loader.ts
export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireAuthentication(request) // DB query #1
  // ...
}
```
```typescript
// app/routes/administration/users/_index/_loader.ts
export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireAuthentication(request) // DB query #2
  // ...
}
```
```typescript
// app/routes/administration/settings/_index/_loader.ts
export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireAuthentication(request) // DB query #3
  // ...
}
```

**Result**: `N loaders × 1 DB query = N database queries` ❌

#### Middleware Approach: Single DB Query

With middleware, **authentication runs once for the entire route tree**:

```
Request: GET /administration/users

Middleware execution:
└── authMiddleware → DB query (once) ✅
    └── context.set(authSessionContext, session)

Route tree execution:
├── __layout (loader)
│   └── context.get(authSessionContext) → from memory ✅
├── __layout-authenticated (loader)
│   └── context.get(authSessionContext) → from memory ✅
└── users/_index (loader)
    └── context.get(authSessionContext) → from memory ✅

Total: 1 database query, shared across all loaders
```

**Example code:**

```typescript
// app/routes/administration/__layout-authenticated/route.tsx
export const middleware: Route.MiddlewareFunction[] = [authMiddleware]
// Runs ONCE per request → DB query #1 (only query!)
```
```typescript
// app/routes/administration/users/_index/_loader.ts
export const loader = async ({ context }: Route.LoaderArgs) => {
  const session = context.get(authSessionContext) // From memory, no DB query
  // ...
}
```
```typescript
// app/routes/administration/settings/_index/_loader.ts
export const loader = async ({ context }: Route.LoaderArgs) => {
  const session = context.get(authSessionContext) // From memory, no DB query
  // ...
}
```

**Result**: `1 middleware × 1 DB query = 1 database query` ✅

#### When Middleware Runs

With **SSR enabled** and routes that have loaders:

| Scenario | Middleware Runs? | DB Queries |
|----------|------------------|------------|
| Full page load (GET /admin/users) | ✅ Yes (once) | 1 |
| Client navigation with loader (/users → /settings) | ✅ Yes (once) | 1 |
| Client navigation without loader | ❌ No | 0 |

**Key Point**: Middleware runs **once per request**, not once per loader.

#### Performance Impact

For a typical admin panel with 3-5 nested loaders per route:

| Approach | DB Queries per Request | Performance |
|----------|------------------------|-------------|
| **Loader-based** | 3-5 queries | ❌ Slower |
| **Middleware** | 1 query | ✅ Faster |

**Savings**: 67-80% reduction in authentication-related database queries.

#### Real-World Example

Current route: `/administration/users`

**Before (Loader-Based)**:
```
// 3 loaders, 3 DB queries
Time: ~30ms (3 × 10ms per query)
```

**After (Middleware)**:
```
// 1 middleware, 1 DB query
Time: ~10ms (1 × 10ms per query)
```

**Performance gain**: 66% faster authentication ⚡

### Implementation Plan

#### 1. Enable Middleware in Config

```typescript
// react-router.config.ts
import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
  future: {
    v8_middleware: true, // Enable middleware support
  },
} satisfies Config
```

#### 2. Create Authentication Context

```typescript
// app/context/auth.context.ts
import { createContext } from 'react-router'
import type { Session, User } from '@prisma/client'

export type AuthSession = {
  id: string
  user: {
    id: string
    email: string
    name: string | null
    role: User['role']
  }
}

export const authSessionContext = createContext<AuthSession | null>(null)
```

#### 3. Create Authentication Middleware

```typescript
// app/middleware/auth.middleware.ts
import { redirect } from 'react-router'
import type { Route } from 'react-router'

import { authSessionContext } from '~/context/auth.context'
import { prisma } from '~/utils/db.server'
import {
  deleteSessionAuthCookieSession,
  getSessionAuthCookieSession,
  getSessionAuthId,
} from '~/utils/auth.server'

export const authMiddleware = async ({
  request,
  context,
}: {
  request: Request
  context: Route.Context
}) => {
  // Get session from cookie
  const cookieSession = await getSessionAuthCookieSession(request)
  const sessionAuthId = getSessionAuthId(cookieSession)

  // No session ID in cookie
  if (sessionAuthId === undefined) {
    throw redirect('/administration/sign-in', {
      headers: {
        'Set-Cookie': await deleteSessionAuthCookieSession(cookieSession),
      },
    })
  }

  // Fetch session from database with user data
  const session = await prisma.session.findUnique({
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    where: {
      id: sessionAuthId,
      expirationDate: {
        gt: new Date(),
      },
    },
  })

  // Session not found or expired
  if (session === null) {
    throw redirect('/administration/sign-in', {
      headers: {
        'Set-Cookie': await deleteSessionAuthCookieSession(cookieSession),
      },
    })
  }

  // Share authenticated session in context for child routes
  context.set(authSessionContext, {
    id: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  })
}
```

#### 4. Apply Middleware to Protected Layout

```typescript
// app/routes/administration/__layout-authenticated/route.tsx
import type { Route } from './+types/route'
import { authMiddleware } from '~/middleware/auth.middleware'

// Apply middleware to this layout and all child routes
export const middleware: Route.MiddlewareFunction[] = [authMiddleware]

// ... rest of layout component
```

#### 5. Access Session in Child Route Loaders

```typescript
// app/routes/administration/users/_index/_loader.ts
import { authSessionContext } from '~/context/auth.context'

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  // Session guaranteed to exist (middleware already checked)
  const session = context.get(authSessionContext)

  // session is type-safe: AuthSession
  console.log(session.user.email)
  console.log(session.user.role)

  // No need to call requireAuthentication!
  // Just fetch route-specific data
  const users = await prisma.user.findMany()

  return { users }
}
```

### Comparison: Before vs After

#### Before (Loader-Based)

```typescript
// Every loader must call requireAuthentication
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication(request)

  // Fetch session again if we need user data
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })

  const users = await prisma.user.findMany()
  return { users }
}
```

#### After (Middleware)

```typescript
// Middleware runs automatically, session available in context
export const loader = async ({ context }: Route.LoaderArgs) => {
  const session = context.get(authSessionContext)

  // Just fetch route-specific data
  const users = await prisma.user.findMany()
  return { users }
}
```

### Migration Steps

#### Step 1: Prepare Infrastructure

1. Enable middleware in `react-router.config.ts`
2. Create `app/context/auth.context.ts`
3. Create `app/middleware/auth.middleware.ts`

#### Step 2: Apply Middleware

```typescript
// app/routes/administration/__layout-authenticated/route.tsx
import { authMiddleware } from '~/middleware/auth.middleware'

export const middleware: Route.MiddlewareFunction[] = [authMiddleware]
```

#### Step 3: Migrate Loaders

For each loader in authenticated routes:

**Before:**
```typescript
const { sessionId } = await requireAuthentication(request)
```

**After:**
```typescript
const session = context.get(authSessionContext)
```

#### Step 4: Update Permission Contexts

```typescript
// Before: Pass request to permission context
const userContext = await getUserPermissionContext(request, {
  actions: ['view'],
  entities: ['user'],
})
```
```typescript
// After: Pass session.id instead
const userContext = await getUserPermissionContext(session.id, {
  actions: ['view'],
  entities: ['user'],
})
```

#### Step 5: Remove Legacy Code

After all loaders are migrated:
- Remove `requireAuthentication` from `app/utils/auth.server.ts`
- Update `getUserPermissionContext` and `getAuthorPermissionContext` to accept `sessionId: string` instead of `request: Request`

### Important Considerations

#### Server-Only Execution

⚠️ **Middleware runs only on server requests**, not on all client-side navigations. This is generally fine for authentication, but be aware:

- Initial page load: ✅ Middleware runs
- Client-side navigation between routes: ⚠️ Middleware might not run
- Hard refresh: ✅ Middleware runs
- Direct URL access: ✅ Middleware runs

For most authentication use cases, this is acceptable because:
- Session context persists during client-side navigation
- Full page loads always re-validate authentication
- Client-side navigation uses cached loader data

#### Error Handling

Errors thrown in middleware (like `redirect()`) are automatically caught and handled by React Router's error boundary system.

#### Type Safety

Using `createContext()` provides full TypeScript type safety:

```typescript
const session = context.get(authSessionContext)
// session is typed as: AuthSession | null
```

### Additional Middleware Examples

#### CSRF Middleware

```typescript
// app/middleware/csrf.middleware.ts
import { csrfTokenContext } from '~/context/csrf.context'
import { commitCSRF } from '~/utils/csrf.server'

export const csrfMiddleware = async ({ request, context }) => {
  const [csrfToken, csrfCookie] = await commitCSRF(request)

  context.set(csrfTokenContext, csrfToken)

  // Return response with CSRF cookie
  return new Response(null, {
    headers: {
      'Set-Cookie': csrfCookie,
    },
  })
}
```

#### Logging Middleware

```typescript
// app/middleware/logging.middleware.ts
export const loggingMiddleware = async ({ request, next }) => {
  const start = Date.now()

  console.log(`[${request.method}] ${request.url}`)

  const response = await next()

  const duration = Date.now() - start
  console.log(`[${response.status}] ${request.url} - ${duration}ms`)

  return response
}
```

#### Combined Middleware

```typescript
// app/routes/administration/__layout-authenticated/route.tsx
import { authMiddleware } from '~/middleware/auth.middleware'
import { csrfMiddleware } from '~/middleware/csrf.middleware'
import { loggingMiddleware } from '~/middleware/logging.middleware'

export const middleware: Route.MiddlewareFunction[] = [
  loggingMiddleware,
  csrfMiddleware,
  authMiddleware,
]
```

## Resources

- [React Router Middleware Documentation](https://reactrouter.com/how-to/middleware)
- [React Router Context API](https://reactrouter.com/how-to/context)
- Current authentication implementation: `app/utils/auth.server.ts`
- Protected layout: `app/routes/administration/__layout-authenticated/route.tsx`

## Status

🔵 **Not Implemented** - This is a future enhancement. The current loader-based approach is working correctly.

Consider implementing middleware when:
- You need to add more authentication features
- You want to reduce code duplication
- You're refactoring the authentication system
- You want better type safety for session data