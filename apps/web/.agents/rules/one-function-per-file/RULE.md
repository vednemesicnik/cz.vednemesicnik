---
name: one-function-per-file
description: |
  One exported function per file in this project.

  Trigger for:
  - Writing a new utility, helper or server function
  - Adding a function to an existing module

  DO NOT trigger for:
  - Framework-dictated modules (`route.tsx`, `_loader.ts`, `_action.ts`, `_meta.ts`, …)
  - Components, which follow their own directory convention (`_component.tsx`)
---

# One Function per File

## Each exported function gets its own file

Name the file after the function in kebab-case, with its test beside it. Related
functions share a directory, not a file:

```
// bad
app/utils/invoice.ts                  → createInvoice, formatInvoiceNumber, …

// good
app/utils/invoice/create-invoice.ts
app/utils/invoice/create-invoice.test.ts
app/utils/invoice/format-invoice-number.ts
app/utils/invoice/format-invoice-number.test.ts
```

A non-exported helper used only by that function may stay in its file. A value
several functions share goes to `app/config/` or its own file, never into a
grab-bag module.

Older multi-function files predate the rule: add new functions beside them in
their own files, and don't split them as a drive-by.

## Why

A file named after its one function is found by name, imported by a path that
says what it is, and tested in isolation. Grab-bag modules grow by accretion
until nobody knows what is in them.
