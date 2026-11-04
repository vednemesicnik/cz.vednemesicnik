# The Design Project

The design that decides this app — public website and administration alike — lives in two
artifacts on claude.ai, reached through the `Artifact` tool (moved from Claude Design in
November 2026). `/ask-design` is the loop that puts questions to it and reads the answers back.

| What              | Artifact                                             | Holds                                                                  |
| ----------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| **App project**   | https://claude.ai/artifact/7KtBFBnBegdW3NePnmYCL2 | Screens (`22 Seznam článků.dc.html`, `07 Stavy a akce obsahu`, `30 Adresy a routování` and the rest), `questions/`, `uploads/podklady/` |
| **Design system** | https://claude.ai/artifact/PqJtpBPrbbf3f9zEw3gMVD | Tokens and **components** (`components/`, `tokens/`, `guidelines/`)     |

Each artifact keeps its content under `project/`. Paths in this document and in the skills are
relative to that folder unless they say otherwise; the tool wants the whole path
(`project/questions/_index.json`).

The app project loads the design system from its own copy,
`_ds/cz-vednemesicnik-design-system-4b484003-…/`. Components live in the design system, not in
the app project's documents (decided 27 Sep 2026, `rd9daf6z`). A component a screen needs before
the system has it is drawn in the screen as a *candidate* and moves into the system later.

## Documents

Numbered by area, one document per screen or topic: `10`–`16` public website,
`20`–`29` administration, `07` the content-state × role × own/any matrix, `30` routing and
error states. Every screen has an **anchor** (`22a`, `22b`, …) that never gets renumbered,
a `URL` line, a drawing and notes with dated decisions. There is no `Flow` document — it was
a dead end in the billing project.

## Reading a screen cheaply

**Read in the main session, never in a subagent:** the reviewing and exploring agents have no
`Artifact` tool. `Artifact` with `action: "list"`, `scope: "files"` and the `url` lists the
files; `action: "read"` with `path`, or `paths` for several in one call, saves each under
`<scratchpad>/artifact-files/<id>/` at its published path and says where. Only a small text file
also comes back in the result.

```sh
pnpm design:screen "<saved file>"                  # the screens it holds: anchor, notes, label
pnpm design:screen "<saved file>" 22a              # one screen as text, notes included
pnpm design:screen "<saved file>" 22a 22b --notes  # only their notes
pnpm design:screen "<saved file>" 22a --html       # the markup
```

A screen is `<section id="22a">` and runs to its own closing tag; its label is the `<span>`
after the anchor badge, its notes the paragraphs that open with a `<strong>` lead. Documents
without anchored sections (tokens, component cards) print nothing — grep the saved file.

**A saved file is as old as its last read.** Reading again overwrites it, and edits in the
artifact's editor save on their own, so read again before relying on a copy from earlier in the
session.

## Writing

Only under `questions/`, and `uploads/` for reference material the user asked to hand over. The
rest is design's. First a `read` of just the `url`, which prints the type's instructions and the
version: a read with `path` does not count as having seen the artifact, and without this one the
publish is refused even when nobody saved. Then read what you change and edit the saved copies.
Keep that short, because a publish sends a file whole and `_index.json` has other writers. Then
one `Artifact` publish, with `root` the saved folder and `files` holding only what changed, `null`
to delete:

```text
url:       the artifact
root:      <scratchpad>/artifact-files/<id>
file_path: <root>/project/compat.json     app project: read it too, send it unchanged
files:     { "project/questions/k7m2x9qa-question.md": "project/questions/k7m2x9qa-question.md",
             "project/questions/_index.json": "project/questions/_index.json",
             "project/questions/gone-answer.md": null }
```

In the design system, which holds the `questions/<code>-port.md` files, `file_path` is the file
being written and `project/design-system.json` stays out of it. That comes from the artifact
type's instructions; nobody has run it yet. Neither artifact takes `index.html`, `SKILL.md` or
`artifact-type/` at its root; those belong to the type. A publish refused because someone saved
meanwhile: read the `url` and the files again and redo the edit, once.

## `questions/`

`/ask-design`'s working folder. A question is named by an eight-character code:
`questions/<code>-question.md`, the answer `questions/<code>-answer.md`, and an optional
`questions/<code>-reply.md` when an answer needs a follow-up before work continues.

**`questions/_index.json`** holds, per code, what retiring a pair needs — for example:

```json
{
  "dj753f0j": {
    "topic": "22 · Seznam článků: otevřené otázky, schvalování, hromadné akce, rubriky",
    "asked": "2026-09-27",
    "for": [409],
    "answered": "2026-09-27",
    "names": [226],
    "wroteTo": [
      { "doc": "22 Seznam článků.dc.html", "screen": "22c", "witness": "potvrzuje dialogem" }
    ]
  }
}
```

- `topic`, `asked`, `for` — written at upload; `for` is the issues the question is asked for.
- `answered`, `names` — the answer's date and every `#n` it mentions, written at `check`.
- `wroteTo` — each document and screen the answer changed, with a **witness**: a short literal
  that stands in that screen because of this decision. `tidy` greps for it instead of re-reading
  the answer.

`/ask-design` keeps the index, and writes only under `questions/`. The design chat sometimes
fills in an entry itself when it answers (`answered`, `wroteTo`) and sometimes forgets, and
another session may have written too. Read it fresh before every write, and at `check` treat an
entry design filled in as a draft: confirm each witness with `pnpm design:screen` before keeping
it.

## Uploaded material

`uploads/podklady/` holds the screenshots of the app as it was on 27 Sep 2026, `ROUTES.md`, the
logo, the pre-redesign tokens and a sample of the billing project's documents. It is reference
material for design; nothing in the code points at it.
