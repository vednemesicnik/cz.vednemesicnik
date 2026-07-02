---
name: package-versions
description: |
  Enforces exact package versions when installing or updating dependencies.

  Trigger for:
  - Running pnpm add / npm install with a package name
  - Editing package.json dependencies or devDependencies directly

  DO NOT trigger for:
  - Reading or auditing existing packages
  - Non-package-related tasks
---

# Package Versions

Always install packages with exact versions — no `^` or `~` prefixes.

## Required flag

```sh
pnpm add <package>@<version> --save-exact
```

## Why

Caret ranges (`^`) allow minor and patch upgrades on the next install, which means two developers (or CI and production) can end up with different resolved versions. Exact pinning ensures every `pnpm install` produces the same dependency tree regardless of when or where it runs.

## What to avoid

```jsonc
// bad — allows automatic upgrades
"react": "^19.1.0"

// good — locked to a specific release
"react": "19.1.0"
```