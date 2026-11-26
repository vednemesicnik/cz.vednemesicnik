---
name: typescript-conventions
description: |
  TypeScript conventions for this project.

  Trigger for:
  - Writing any TypeScript type definitions
  - Defining shapes for objects, options, results, or callbacks
  - Documenting an exported function, its parameters, or its return value

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

## Document with TSDoc, not inline field comments

Put an exported function's documentation in a TSDoc block (`/** … */` with `@param` / `@returns`) on the **function**. Do not scatter the explanation as inline `//` comments on the type's fields — TSDoc surfaces in editor hovers and reads as the API contract, while field comments are easy to miss and drift.

```ts
// bad — behavior described as inline comments on the type
type FormattedDate = {
  iso: string | null // machine value — seeds pickers, <time dateTime>
  formatted: string // display value — '...' for null
}

// good — the contract lives in TSDoc on the function
type FormattedDate = {
  iso: string | null
  formatted: string
}

/**
 * Builds the {@link FormattedDate} that carries a date across the loader → UI boundary.
 *
 * @param date - The date to format, or `null` for a not-yet-set value.
 * @param options - Optional `locale`, forwarded to {@link formatDate}.
 * @returns `iso` — the machine value that seeds date pickers and `<time dateTime>`, or
 *   `null` for a null date; `formatted` — the display value, `'...'` for null.
 */
export const createFormattedDate = (
  date: Date | null,
  options?: FormatDateOptions,
): FormattedDate => { /* … */ }
```

Keep TSDoc concise — document what isn't obvious from the signature (semantics, edge cases like the null fallback), not a restatement of the types.