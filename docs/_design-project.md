# The Design Project

The design that decides this app — public website and administration alike — lives in
Claude Design, reached through `DesignSync`. `/ask-design` is the loop that puts questions
to it and reads the answers back.

| What                  | Id                                     | Holds                                                                  |
| --------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| **App project**       | `60d13daa-be98-47ec-95e1-e8913a86fef4` | Screens (`22 Seznam článků.dc.html` first; `07 · Stavy a akce obsahu`, `30 · Adresy a routování` and the rest planned), `questions/`, `uploads/podklady/` |
| **Design system**     | `4b484003-4984-46c4-86cc-a96eee9e4b4a` | Tokens and **components** (`components/`, `tokens/`, `guidelines/`)     |

The app project loads the design system as `_ds/cz-vednemesicnik-design-system-4b484003-…/`.
Components live in the design system, not in the app project's documents (decided
27 Sep 2026, `rd9daf6z`). A component a screen needs before the system has it is drawn
in the screen as a *candidate* and moves into the system later.

The app project is `PROJECT_TYPE_PROJECT`, so `list_projects` does not list it. `get_project`,
`list_files`, `get_file` and the write methods all work when handed the id.

## Documents

Numbered by area, one document per screen or topic: `10`–`16` public website,
`20`–`29` administration, `07` the content-state × role × own/any matrix, `30` routing and
error states. Every screen has an **anchor** (`22a`, `22b`, …) that never gets renumbered,
a `URL` line, a drawing and notes with dated decisions. There is no `Flow` document — it was
a dead end in the billing project.

## Reading a screen cheaply

**`get_file` in the main session, never in a subagent.** A result over a few kilobytes is saved
to a file (`Full output saved to: …/tool-results/<id>.txt`) with a short preview. A subagent pays
the whole document into its own context.

```sh
pnpm design:screen <saved file>                  # the screens it holds: anchor, notes, label
pnpm design:screen <saved file> 22a              # one screen as text, notes included
pnpm design:screen <saved file> 22a 22b --notes  # only their notes
pnpm design:screen <saved file> 22a --html       # the markup
```

A screen is `<section id="22a">` and runs to its own closing tag; its label is the `<span>`
after the anchor badge, its notes the paragraphs that open with a `<strong>` lead. Documents
without anchored sections (tokens, component cards) print nothing — extract them with
`jq -r .content <saved file> > <scratchpad>/<name>.html` and grep.

**Fetch a document twice and two saved files exist; only the newest is live.** Key any sweep
over saved results by the newest `mtime`, not by the path inside the file.

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

Only `/ask-design` writes the index, and only under `questions/`. Read it fresh before every
write — the design chat does not edit it, but another session may have.

## Uploaded material

`uploads/podklady/` holds the screenshots of the app as it was on 27 Sep 2026, `ROUTES.md`, the
logo, the pre-redesign tokens and a sample of the billing project's documents. It is reference
material for design; nothing in the code points at it.
