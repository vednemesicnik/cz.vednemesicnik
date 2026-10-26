# 0039. A public address is unique only once it is published, and a Document keeps what was typed

- Date: 2026-10-23
- Issues: #780
- Later: 0047

## Context

A record is identified by its `id`. An article's `slug` and an archive issue's year, order and
supplement were unique only because they become public addresses: the article's URL, the issue's
number and its PDF's name. The unique constraints sat on the columns the editors write, so an
autosave ([0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md)) that met a
taken address or number had to leave it out. The stored value stayed, and the typed one lived only
in the open page, so a reload lost it. The answer came back in custom JSON (`slugSuggestion`,
`numberConflict`). The route held it in `useState` and put it into the field's `errors` beside
Conform's own. The message named the record that held the value, as a link. The user edit form did
the same with `actionData.emailOwner`.

None of this was a product or architecture call. The drawings (24d, 26d, 28e) showed it, and
the code followed them. A person expects an autosaving editor to keep what they typed. A message
about a taken value needs to say only that it is taken.

## Outcome

- **The value as published is stored on its own.** A public address that must be unique lives in
  a `published…` column next to the working one: `Article.publishedSlug` and
  `Issue.publishedNumber`, which is the key built from year, order and supplement slug. Only these
  columns are `@unique`. The working columns (`slug`, `year`, `order`, `supplementSlug`) hold what
  the editor typed. The editor, the detail and the lists show the working value. Public reads go
  through the published value.
- **Only publishing writes the published value.** It writes it in one interactive transaction with
  the state change, `PageSEO.pathname` and the issue PDF's `fileName`. The edit hold's conditional
  write stays inside that transaction
  ([0019](0019-the-edit-lock-lives-on-the-content-row.md),
  [0021](0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md)). A unique
  violation in it comes back as a missing item, not as an error.
- **Whoever has the published value holds it.** Retracting and restoring keep it, so a retracted
  article keeps its address and no draft can take it. A record holds one value at a time.
  Re-publishing under another value frees the old one, and deleting the record frees the one it
  holds.
- **Submit for review and approve only check.** A conflict with another record's published value
  refuses submit, approve and publish, single or bulk. The missing-content dialog (23h) names it
  next to what is missing.
- **A Document saves what was typed.** A taken address or number is saved, and the editor reports
  it. A value that cannot be stored at all, such as letters in an issue's year or order, is still
  left out of the save, and the rest saves.
- **Server findings reach the form only through Conform.** The loader and every save's answer
  report a taken value as data. The editor keeps the taken values (`useTakenValues`), and its own
  schema (`createEditorSchema`) turns the field's value into a field error while it is one of
  them. The error is Conform's own validation, so typing anywhere keeps it, and editing the field
  clears it as soon as the value differs. No route keeps an error in its own state next to
  Conform. The server never refuses a save for a conflict.
- **A message about a taken value is one plain sentence.** It does not name the holder or link to
  it. That covers the article address, the issue number and the user e-mail alike. An offer of a
  free value (*Použít …*) stays, as data next to the error, not inside it.

## What follows

- **This changes direction from five earlier entries, each in part** (they get `Later: 0039`).
  The rest of each still describes the app.
  - [0020](0020-a-new-article-is-a-draft-created-on-click.md): `Article.slug` is no longer
    unique, and the public queries read `publishedSlug`. A draft without an address still stores
    none.
  - [0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md): "a part that cannot
    save is left out" now covers only a value that cannot be stored. A taken address saves, and an
    offer is data, not part of the answer's error.
  - [0030](0030-an-archive-issue-is-year-order-and-supplement-and-its-title-is-computed.md): the
    unique key moves to `publishedNumber`. The PDF gets its name at publish. A supplement's main
    issue is resolved against the issue that holds `publishedNumber`. The computed title,
    `supplementSlug` as `""` and the naming scheme stay.
  - [0033](0033-an-issue-pdf-has-no-file-name-until-its-number-is-complete.md): a draft save no
    longer names the PDF. A PDF has no name, and so no address, until its issue is published. The
    editor shows the address it will get. Nameless PDFs and their handling stay.
  - [0034](0034-a-new-archive-issue-starts-without-a-number-and-the-editor-offers-the-next-free-one.md):
    a taken number saves as typed, and the answer names no holder. The year, order and supplement
    still save as one, and only an unreadable value leaves them out.
- **PageSEO follows the published value.** A draft that was never published has no PageSEO row,
  as a draft without an address has none today. A retracted one keeps its row at the published
  address.
- **Writes outside the app must set the published value.** That covers the seed, scripts,
  Prisma Studio on production and the Medium import (#738). A published row without it disappears
  from the web, which is visible rather than a silent duplicate. The migration backfills it for
  published and archived content, and for drafts that were published before.
- **Editors stay not live** ([0035](0035-every-administration-page-is-live.md)). The editor
  recomputes a conflict on each save and each load of its route.
- **The article goes first; the archive issue follows** in its own PR of #780, with
  `publishedNumber`, the PDF named at publish and its draft preview at the provisional address.
- **A draft's web preview** goes by the address with the article's id (`?id=`), since two drafts
  may share an address. The public lists, which show a signed-in author's drafts too, still link
  by the address alone: a draft that shares a published article's address opens the published
  one there. The administration's preview link opens the draft.
- **Episodes follow the same rule when their editor is rebuilt (27d):** `publishedNumber` per
  podcast and `publishedSlug`. So does any later Document whose working value becomes a unique
  public address. A *Záznam* form, saved with a button (categories, tags, users), may simply
  refuse the save, because nothing typed is lost there.
- **Revisit this** if a draft ever needs a public address of its own, for example a shareable
  preview by slug. Today a draft's web preview goes by `id`.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **Feeding the server's field errors back through Conform's `lastResult`, kept across intents with
  `conformZodMessage.VALIDATION_SKIPPED`.** Conform's `report()` drops every error a result leaves
  out, rewrites the values from `initialValue` and moves the focus on `status: 'error'`, so an
  autosave answer would fight the person typing. A schema refinement over the taken values is
  Conform's own validation and has none of that.

- **A `pendingInput` JSON column holding what could not be applied.** The typed value would
  survive, but the editor would show it while the detail and the lists show the stored one. A
  value would also stay pending when the holder freed it, and every reader would have to know the
  column.
- **A partial unique index on the working column for content that is not a draft**
  (`WHERE state <> 'draft'`). It keeps a database guarantee without a new column. But Prisma's
  `partialIndexes` is a preview feature with Prisma 8 in release candidates. It also does not keep a
  retracted article's address without an extra rule on `publishedAt`.
- **Dropping uniqueness and checking in the app only.** The seed, scripts and imports could
  bypass it, and two publishes could race.
- **Writing the published value at submit.** A withdrawn or returned submission would keep it and
  block every other draft. A Coordinator's later edit of the slug would also leave it stale.
