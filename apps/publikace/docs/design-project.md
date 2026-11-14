# The design project

The design that decides this app lives in two artifacts on claude.ai, reached through the
`Artifact` tool. `/ask-design` is the loop that puts questions to them and reads the answers
back, and the `ux-designer` agent answers them.

| What              | Artifact                                          | Holds                                                                                                                            |
| ----------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Design canvas** | https://claude.ai/artifact/SKvozjKupKyCU2wHDZE3Qg | _Publikace._ — the pages (`Main.dc.html` is `00 Úvod a mapa`, then `01`…`30`), `navrh.css`, the design-system copy, `questions/` |
| **Design system** | https://claude.ai/artifact/PqJtpBPrbbf3f9zEw3gMVD | _cz.vednemesicnik design system_ — tokens and components, shared with the magazine and with Fakturace                            |

Each artifact keeps its content under `project/`. Paths in this document and in the skills are
relative to that folder unless they say otherwise; the tool wants the whole path
(`project/questions/_index.json`).

**The design system is the magazine's, not this app's.** The administration of `cz.vednemesicnik`
and Fakturace draw from it too, so a token or a component changed there changes all three. The
canvas carries a copy of it under `project/ds/vednemsnkdesignsystem-4b4840/` and loads the
components from its `_ds_bundle.js`. **The connection runs both ways:** whatever Publikace needs
and the system lacks is added to the system rather than kept as a second one here.

## The designer

Artifacts have no chat of their own, so [.claude/agents/ux-designer.md](../.claude/agents/ux-designer.md)
does the design work: it takes a brief, decides the UX, draws and publishes. Nobody pastes a
prompt anywhere. The session that asked writes the brief under `questions/` and checks the result;
the pages and the drawings are the agent's.

## Pages and files

The canvas has one **page** per topic, in the canvas's Pages menu, and one or more **files** per
page, the way the magazine's design project is laid out:

| Page                     | Files                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| 00 Úvod a mapa           | `Main.dc.html` — the map of every file (`00a`), access, what replaces what |
| 01 Stavy a souhlasy      | `01-Stavy.dc.html` — the source of truth for every status tag              |
| 02 Odkazy pro redakci    | `02-Odkazy.dc.html`                                                        |
| 03 K rozhodnutí          | `03-K-rozhodnuti.dc.html` — every open decision, who decides it            |
| 10 Přihlášení            | `10-Prihlaseni.dc.html`                                                    |
| 11 Vydání                | `11-Vydani.dc.html`, `11-Vydani-nove.dc.html`, `11-Vydani-telefon.dc.html` |
| 12 Detail vydání         | `12-Detail-vydani.dc.html`, `…-skupiny.dc.html`, `…-uzavreni.dc.html`      |
| 13 Ke kontrole           | `13-Ke-kontrole.dc.html`                                                   |
| 14 Nastavení             | `14-Nastaveni.dc.html`, `14-Nastaveni-ulohy.dc.html`                       |
| 20 Nový článek · odkaz   | `20-Novy-clanek.dc.html`, `20-Novy-clanek-odeslani.dc.html`                |
| 21 Obrazová díla · odkaz | `21-Obrazova-dila.dc.html`, `21-Obrazova-dila-odeslani.dc.html`            |
| 30 Tmavý režim           | `30-Tmavy-rezim.dc.html`                                                   |
| Součástky                | `Panel.dc.html` — the sidebar every screen of the editors-in-chief imports |

Every screen has an **anchor** (`11d`, `12b`) that never gets renumbered. A screen is a
`<section id="12b" class="sec">`; its decisions are the `.dec` paragraphs under it, its notes that
do not print are `.anno`. Page chrome lives in `project/navrh.css`. URL paths in the drawings are
English (`/issues/{name}`), the text of the app is Czech.

## Reading a screen cheaply

**Read in the main session or in `ux-designer`, never in another subagent:** the reviewing and
exploring agents have no `Artifact` tool. `Artifact` with `action: "list"`, `scope: "files"` and
the `url` lists the files; `action: "read"` with `path`, or `paths` for several in one call, saves
each under `<scratchpad>/artifact-files/<id>/` at its published path and says where.

```sh
pnpm -s design:screen "<saved file>"                  # the screens it holds: id, notes, label
pnpm -s design:screen "<saved file>" 12b              # one screen as text, notes included
pnpm -s design:screen "<saved file>" 12b 21a --notes  # only their notes
pnpm -s design:screen "<saved file>" 12b --html       # the markup, for a grid or a style
```

**A saved file is as old as its last read.** Reading again overwrites it, and edits in the
canvas's editor save on their own, so read again before relying on a copy from earlier.

## Writing

The session that asks writes only under `questions/`, and `uploads/` for reference material the
user asked to hand over. The rest is the designer's. For either of them, first a `read` of just
the `url`, which prints the type's instructions and the version. Then read what you change and
edit the saved copies. Then one `Artifact` publish, with `root` the saved folder, `file_path` one
changed file and `files` the others, `null` to delete:

```text
url:       the canvas
root:      <scratchpad>/artifact-files/<id>
file_path: <root>/project/questions/k7m2x9qa-question.md
files:     { "project/questions/_index.json": "project/questions/_index.json" }
```

`project/canvas.json` goes in only when the layout changes (a new file, a page, a moved board),
read again right before, with every other key kept. Neither artifact takes `index.html`,
`SKILL.md` or `artifact-type/`; those belong to the type. Refused because someone saved
meanwhile: read the `url` and the files again and redo the edit, once.

**The design system's `questions/` is the magazine's.** Publikace's questions go to the canvas,
even when the answer changes the system; the designer writes the system's change and the answer
stays beside the question.

## The questions index

`questions/` is `/ask-design`'s working folder. A question is named by an eight-character code:
`questions/<code>-question.md`, the answer `questions/<code>-answer.md`, and an optional
`questions/<code>-reply.md` when an answer needs a follow-up from a later session.

**`questions/_index.json`** holds what retiring a pair needs to know, keyed by the code:

```json
{
  "k7m2x9qa": {
    "topic": "odkaz na díla k článku v uvítacím e-mailu",
    "asked": "2026-11-20",
    "for": [12],
    "answered": "2026-11-20",
    "names": [12],
    "wroteTo": [
      {
        "doc": "20-Novy-clanek-odeslani.dc.html",
        "screen": "20d",
        "witness": "Nahrát obrazová díla"
      }
    ]
  }
}
```

- **`topic`**, **`asked`**, **`for`**: what the question is about, when it was put, and the issues
  it was asked for. Written at upload.
- **`answered`**, **`names`**: the answer's date, and every `#n` the answer mentions. Written at
  `check`.
- **`wroteTo`**: each screen the answer changed, with a **witness** — a short literal that stands
  there because of this decision. `/next-issue` checks the witness before it retires the pair.

## Open decisions

`03 K rozhodnutí` lists what the design assumed and who has to confirm it. When one is decided,
the row becomes _Rozhodnuto ⟨datum⟩_ and the page that draws it is corrected in the same pass.
