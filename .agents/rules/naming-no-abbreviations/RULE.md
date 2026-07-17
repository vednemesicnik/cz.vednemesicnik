---
name: naming-no-abbreviations
description: |
  Naming conventions for identifiers in this project.

  Trigger for:
  - Naming any variable, function parameter, function, or callback argument
  - Reviewing or copying code (incl. AI/tool suggestions) that introduces short abbreviations

  DO NOT trigger for:
  - Framework- or library-dictated names you don't control (e.g. `req`/`res` only if a signature forces them)
  - Established domain acronyms that are clearer than their expansion (e.g. `id`, `url`, `html`, `csrf`, `seo`)
---

# Naming: no abbreviations

## Write identifiers in full

Name variables, parameters, and functions with full words. Short abbreviations
are harder to read and force the reader to expand them mentally.

```ts
// bad
prisma.$transaction(async (tx) => {
  await tx.pageSEO.deleteMany({ where: { pathname } })
})

const res = await fetchArticles()
const btn = document.querySelector("button")
const idx = items.findIndex((i) => i.id === id)

// good
prisma.$transaction(async (transaction) => {
  await transaction.pageSEO.deleteMany({ where: { pathname } })
})

const response = await fetchArticles()
const button = document.querySelector("button")
const index = items.findIndex((item) => item.id === id)
```

### Why

Code is read far more often than it is written. A full name (`transaction`,
`response`, `index`) is self-documenting; an abbreviation (`tx`, `res`, `idx`)
saves a few keystrokes at the cost of readability. This applies to code copied
from AI or tool suggestions too — expand their abbreviations before committing.

### Allowed

Widely understood domain acronyms that are clearer in short form stay as-is:
`id`, `url`, `html`, `csrf`, `seo`, `pdf`. When in doubt, prefer the full word.
