---
name: comments
description: |
  What a comment in this codebase is for, and what belongs in git instead.

  Trigger for:
  - Writing or editing any comment, TSDoc block or CSS comment
  - Changing a value, a token or a style that already carries a comment
  - Reviewing a diff that adds comments

  DO NOT trigger for:
  - Commit messages, PR bodies and issue text, which are exactly where history belongs
  - UI strings, which stay Czech and are not comments
---

# Comments

## A comment explains the code as it stands

It gives the reader context they cannot get from the code in front of them: why this value,
why not the obvious alternative, what breaks if it changes. Written so it still reads correctly a
year later, to somebody who has never seen the change that introduced it.

Comments are in English, short, and only where they carry something: a non-obvious why, a trap.
The words a user reads stay Czech in the string itself.

```css
/* bad — a changelog entry, meaningless to anyone who did not watch it happen */
.badge {
  /* The gap used to be 4px and grew, because the icon was moved down a pixel. */
  gap: 0.5rem;
}

/* good — the rule the line follows, stated once */
.badge {
  /* The same gap as the button's icon, so a badge and a button line up in one row. */
  gap: 0.5rem;
}
```

## Never narrate the change

**"Was", "used to", "no longer", "it replaces", "now", "fixed" — none of these belong in a
comment.** The diff is in `git log`, the argument is in the issue and the PR, and both are one
command away. A comment that describes a change starts rotting the moment the next one lands: it
accumulates, it contradicts, and the reader cannot tell which sentence is still true. The same
goes for the bug a change fixed: say what the code does, not how it was once broken.

```tsx
// bad
// The list used to be sorted here, which broke when the loader started paging,
// so the order now comes from the query.
const recipes = loaderData.recipes

// good
// The query orders the page; sorting here would reorder only the rows on it.
const recipes = loaderData.recipes
```

The test is mechanical: **delete every clause about the past. If what is left explains the code,
that was the comment. If nothing is left, there was no comment to write.**

## Nothing the code already says

No comment for what is plainly readable. A decision does not earn one either if the code carries
it by itself. No sample values from real data in a comment either: they go stale, and the tests
carry the concrete cases.

```tsx
// bad — the line read aloud
// Render the title as an h2.
<h2 className={styles.title}>{children}</h2>

// good — the part the line cannot say
// An h2, because the card always sits under the page's h1 and never stands alone.
<h2 className={styles.title}>{children}</h2>
```

## An export is documented in TSDoc

What a caller needs to know about an exported function or component — what it takes, what it
returns, what it guarantees — goes in a `/** … */` block on the export, where the editor shows it
on hover. Not in inline comments on the type's fields; the TSDoc format is in
`../typescript-conventions/RULE.md`. A line comment inside the body stays for the why of one line.

## Where an argument is long, cite it rather than retell it

Design decisions live in the design project's answers, the reasons for a direction in the
repository's work log (`docs/work-log/` at the root), schema decisions in the migration. A comment names the address and states the
conclusion — `(design 12c)`, `(log 0042)`, `(#123)` — and does not reproduce the reasoning,
because the copy is what goes stale.

```ts
// bad — the design answer retold, and out of date on its next revision
// The design wants the count hidden at zero because an empty badge looked like
// an error in testing, and the designer also considered a dash but…

// good
// Hidden at zero (design 12c).
```

## Existing comments

Plenty of comments here predate this rule. Rewrite one when you are already working in it. Do not
sweep the rest as a side errand: a comment nobody is reading does no harm, and a mass rewrite of
prose is a diff nobody can review.

## Why

A comment is read without the context of the change that wrote it. One that states the code's
reason stays true as long as the code does; one that tells a story is wrong after the next commit
and nobody notices. History has its own places, and they are searchable.
