---
name: file-naming
description: |
  File naming conventions for this project.

  Trigger for:
  - Creating any new file (TypeScript, CSS, config, etc.)
  - Renaming an existing file

  DO NOT trigger for:
  - Files whose names are dictated by a framework convention (e.g. `route.tsx`, `+types/`, `_action.ts`, `_middleware.ts`, `RULE.md`)
---

# File Naming

## kebab-case

All file names use kebab-case.

```
// bad
formatRetryAfter.ts
FormatRetryAfter.ts
format_retry_after.ts

// good
format-retry-after.ts
rate-limit-middleware.md
```