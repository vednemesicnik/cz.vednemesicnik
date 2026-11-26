---
name: functional-style
description: |
  Functional programming conventions for this project.

  Trigger for:
  - Writing any stateful object (store, registry, cache, manager)
  - Considering a class to encapsulate shared state or behavior

  DO NOT trigger for:
  - Third-party libraries that require `class` (e.g. extending a framework base class)
---

# Functional Style

## Prefer factory functions over classes

Avoid `class` declarations. When a stateful object is needed, use a factory function with a closure:

```ts
// bad
class InMemoryStore {
  private buckets = new Map()
  hit(...) { ... }
}

// good
function createInMemoryStore(): RateLimitStore {
  const buckets = new Map()
  return {
    hit(...) { ... },
  }
}
```

## Why

Factory functions are idiomatic functional TypeScript. Classes add OOP ceremony (`this`, `new`, `implements`) that is unnecessary in application code where the object is only ever created once.