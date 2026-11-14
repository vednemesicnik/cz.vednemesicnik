---
name: comments
description: |
  What a comment in this codebase is for, and what belongs in git instead.

  Trigger for:
  - Writing or editing any comment, docblock or block comment
  - Changing a value, a token or a style that already carries a comment
  - Reviewing a diff that adds comments

  DO NOT trigger for:
  - Commit messages, PR bodies and issue text, which are exactly where history belongs
---

# Comments

> Carried over from `cz.vednemesicnik.billing` while this repository has no application code yet.
> The rule applies here as written; the files it cites as examples are billing's. Replace them
> with this repository's own as the app grows.

## A comment explains the code as it stands

It gives the reader context they cannot get from the code in front of them: why this value,
why not the obvious alternative, what breaks if it changes. Written so it still reads
correctly a year later, to somebody who has never seen the change that introduced it.

```ts
// bad — a changelog entry, meaningless to anyone who did not watch it happen
/* The tracking was `-0.01em`, and it goes because 04 gives `tight` to headings from
   `md` up. At 14 px the difference is 0.14 px per character. */
letterSpacing: 'var(--tracking-normal)',

// good — the rule the line follows, stated once
/* `normal`, because 04 reserves `tight` for headings from `md` up and a button label is
   ordinary text whatever its size. */
letterSpacing: 'var(--tracking-normal)',
```

## Never narrate the change

**"Was", "used to", "no longer", "it replaces", "this is now" — none of these belong in a
comment.** The diff is in `git log`, the argument is in the issue and the PR, and both are
one command away. A comment that describes a change starts rotting the moment the next one
lands: it accumulates, it contradicts, and the reader cannot tell which sentence is still
true.

```ts
// bad
/* It used to carry the figures utility, which on `{mesic}` did nothing at all — there
   are no digits for tabular figures to line up — while the button two elements away
   reached for the monospaced face. One mark, one face. */

// good
/* The same literal as the button above, so the same family. */
```

The test is mechanical: **delete every clause about the past. If what is left explains the
code, that was the comment. If nothing is left, there was no comment to write.**

## Nothing the code already says

No comment for what is plainly readable. A decision does not earn one either, if the code
carries the decision by itself. Match the density around you — this codebase comments
heavily, but every one of them is load-bearing.

```ts
// bad — three ways of reading the same line
/* The page title at display-sm with line-height 1.2. */

// good — the part the line cannot say
/* If the header ever reads tight, the space belongs in `margin` here, where it is
   visible and editable, rather than in a leading nobody would think to look at. */
```

## The codebase is mid-migration on this

In `cz.vednemesicnik.billing` about thirty comments still narrate a change — `signature-storage.server.ts`,
`domain/invoice.ts`, `sqlite-invoice-repository.server.ts` and others carry a paragraph
about what a column or a type used to be. They predate this rule.

Rewrite one when you are already working in it, the same way `app/ui/` converts to folders.
Do not sweep the rest as a side errand: a comment nobody is reading is doing no harm, and a
mass rewrite of prose is a diff nobody can review.

## Where an argument is long, cite it rather than retell it

Design decisions live in `Primitiva a sémantika.dc.html` and the answers beside it; schema decisions
live in the migration. A comment names the address and states the conclusion. It does not
reproduce the reasoning, because the copy is what goes stale.
