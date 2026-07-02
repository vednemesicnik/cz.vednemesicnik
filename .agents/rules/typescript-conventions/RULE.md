---
name: typescript-conventions
description: |
  TypeScript conventions for this project.

  Trigger for:
  - Writing any TypeScript type definitions
  - Defining shapes for objects, options, results, or callbacks

  DO NOT trigger for:
  - External library types that are inherently interfaces (e.g. implementing a known interface from a dependency)
---

# TypeScript Conventions

## Prefer `type` over `interface`

Always use `type` for type definitions. This is a regular application, not a library — `interface` declaration merging and `implements` inheritance are not needed.

```ts
// bad
interface RateLimitStore {
  hit(key: string, limit: number, windowMs: number): RateLimitResult
}

// good
type RateLimitStore = {
  hit(key: string, limit: number, windowMs: number): RateLimitResult
}
```

### Why

`interface` is designed for library authors who need declaration merging and `extends`-based hierarchies. In application code, `type` is simpler, more consistent, and equally capable.