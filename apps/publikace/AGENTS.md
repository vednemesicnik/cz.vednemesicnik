# cz.vednemesicnik.publikace Agent Guide

The magazine's publishing app on `publikace.vednemesicnik.cz`. [README.md](README.md) explains
what it does; this file is about working in it without breaking something expensive. The plan of
how it works, with diagrams, is [docs/product.md](docs/product.md),
[docs/architecture.md](docs/architecture.md) and [docs/security.md](docs/security.md); what still
disagrees is in [docs/review-2026-11-24.md](docs/review-2026-11-24.md).

## Where the project stands

**The first screens on a finished design.** The app is drawn in the design canvas
([docs/design-project.md](docs/design-project.md)) and the open decisions are on its page
`03 K rozhodnutí`. Built so far, on Remix 3 with a SQLite database that migrates on startup:
Google sign-in and Přístup in `/settings` with the `publikace.app@` account, the issues (`/`,
`/issues/new`, `/issues/{name}`) with their folders on Drive, and the newsroom's link, whose
public page `/l/{key}/article` creates an article with its Doc and mails its authors, and the
handover to proofreading in the issue detail, which the proofreaders hear of in one digest a
morning, and the page `/proofreading`, where they sign in to take a text, give it back, and mark
its final version: a PDF in the article folder and one clause per author, which
`SCRIPT__Publication__Article_Approvals` claims through `/api/v1/approvals`, mails to the
author and reads the reply to, so that one not exactly „Souhlasím“ reaches _Ke kontrole_ beside
the artworks' (#89); the article's row in the issue detail opens to each author's clause, and
_Poslat žádost znovu_ hands one back to the job under a new Mailer key (#92); once the job took the
clauses and before every author agreed, _Označit novou finální verzi…_ in the row's „⋯“ puts a new
PDF and new requests in place of the old ones, which stop counting (#90); and once every author
agreed, a revision of the Doc after its PDF, which the issue detail asks Drive about once it stands,
makes the article _Upraveno po schválení_ with _Označit novou verzi…_ in its row (#101); and an
issue closed from either „⋯“, which takes its links from the newsroom and its articles from the
jobs, and reopened with the same links (#106); and the record, an issue's row in the Registr and
its Evidence in the scripts' columns, rewritten by a queue in the app's process every 30 s after
the database changes and in full once a day, with _Otevřít Evidenci_ in the issue's „⋯“ (#111); and the print folder, which
`SCRIPT__Publication__Print_Handoff` fills with the approved texts and the artworks with consent
through `/api/v1/print-handoff`, and which the issue detail's _Podklady pro tisk_ says the fill of
(#110); and a reply in _Ke kontrole_ answered from its card, which the Mailer sends inside the
thread of the request and which puts the provider or the author on the move until they write
again (#31); and Nastavení › _Soubory na Disku_, which links the issues folder, the Registr and
the article template from the deployment's IDs and says when no Registr is written (#116); and an
issue's artwork groups, which the editors-in-chief create in its detail and whose link uploads
like an article's, its batches going to _Ke kontrole_, the record and the print folder (#133); and
_Přejmenovat vydání…_ and _Odebrat vydání…_ in an issue's „⋯“, which rename its folder and every
`_meta.json` in it, or bin an empty issue's folder and free its name (#151); and
_Přejmenovat článek…_ and _Upravit autory…_ in an article's „⋯“, which rename its Doc, folder and
`_meta.json`, or correct its authors there and in the database, a welcome going to each new
address before the final version and a corrected request after it (#152); and
_Odebrat článek…_ in an article's „⋯“, which bins its folder, and _Zahodit dávku_ also after its
request went (#153); and _Upravit název a poznámku…_ and _Odebrat skupinu…_ in a group's „⋯“,
which rename its folder and `_meta.json` or save a note alone, or bin a group without artworks
(#154); and the comment digest's API, through which `SCRIPT__Publication__Article_Comments` claims
the articles of the open issues with their authors and how far each was told of, and reports the
e-mails the Mailer confirmed, which _Připomínky ke článkům_ in `/settings/jobs` shows (#170).
Nothing runs on Fly.io yet, and the background jobs still read the sheets,
except the artwork reply check, the article approvals, the print folder, the comment digest's API and the proofreaders' digest, which go
through the app's API and whose runs
`/settings/jobs` shows, with a banner over every screen once two in a row failed (once, for the
digest). What the app does on Drive and through the Mailer
is tried against the real services by hand, as
[docs/real-drive-round-trip.md](docs/real-drive-round-trip.md) lays out, before the scripts are
switched off. Beside it sits the setup shared with `cz.vednemesicnik` and
`cz.vednemesicnik.billing`: the workflow skills, the agent rules, the designer agent, the PR and
issue templates, CI and the hooks.

## Commands

```sh
pnpm install
pnpm dev:setup-claude # the .claude/skills symlinks, the Remix skill, and a CLAUDE.md importing this file
pnpm app:dev          # http://localhost:44100, restarts on change
pnpm app:start        # the same server with NODE_ENV=production
pnpm app:fake         # the app on a fake Drive, Mailer and database, http://127.0.0.1:44110/_fake
pnpm typecheck        # tsc --noEmit
pnpm test             # remix test --type server
pnpm app:doctor       # remix doctor, strict: a warning fails it
pnpm db:status        # remix db status — also db:migrate, db:rollback
pnpm lint             # oxlint
pnpm format           # oxfmt --write
pnpm format:check
pnpm design:screen    # one screen out of a saved design file — docs/design-project.md
```

**Node 26 or newer is required**, as in billing: the app uses `Temporal`, `node:sqlite` and
the runtime's own TypeScript stripping (`node scripts/….ts` runs without a build step).

**The database is `DATABASE_PATH`, `./db/publikace.sqlite` by default.** `createPublikace`
applies pending migrations from `db/migrations` before its first request, and `pnpm db:*` reads the same
directory through `remix db`, configured in `remix.json`. A migration that has run is never
edited; the journal keeps its checksum and both refuse a database whose history changed.
[docs/migrations.md](docs/migrations.md) has the layout, the commands and how the SQL is
written.

`lefthook` runs lint and format on commit, and lint, format, typecheck, the suite and doctor on
push. `postinstall` writes the hooks by running
`lefthook install`, and [pnpm-workspace.yaml](pnpm-workspace.yaml) refuses lefthook's own install
script so that the step reads from this repository. A clone whose hooks never fire had its
install scripts skipped: `pnpm exec lefthook install` is the fix.
[ci.yml](.github/workflows/ci.yml) runs the PR title, the release version, lint, format,
typecheck, the suite and doctor on every PR into `dev` or `main`, and the `branch-protection`
ruleset requires them. Every merge into `main` is tagged
with a version by [release.yml](.github/workflows/release.yml): `0.x` until the app runs on
Fly.io, and from `v1.0.0` also a GitHub Release. See
[docs/branching-model.md](docs/branching-model.md).

## What the app will be

- **Remix 3 on Fly.io, the stack of Fakturace.** Node 26, `node:sqlite`, one machine with a
  volume, the same patterns for the repository, migrations and backups. Refer to
  `./.agents/skills/remix/SKILL.md` (the `remix` skill) once `pnpm dev:setup-claude` has copied
  it.
- **The app's SQLite database is the source of truth** for issues, articles, editorial clauses,
  artworks and their groups, consent states, shared links and job runs. The editors-in-chief only
  ever looked at the sheets, and the one thing done in them by hand, verifying a consent the
  scripts could not read, is the app's _Ke kontrole_.
- **The Registr and each issue's Evidence stay, as a record the app writes and never reads.**
  They are where a licence is looked up, in the same columns for every issue, old or new. The
  app writes the database first and the sheet after it, from a queue that retries, so a sheet
  that does not answer delays the record and blocks nothing; a nightly rewrite from the database
  mends whatever the queue missed. Only `publikace.app@` may edit them, people read them, and
  neither the app nor a script reads them back: a hand edit would vanish unseen. _Podklady_ for
  the graphic designer stays a sheet too, filled by its job.
- **Drive holds the files, Gmail holds the proof.** Folders, article Docs, the PDFs of final
  versions, artworks and licences stay on Drive; a consent is the archived e-mail conversation.
  The database keeps their IDs and links, never their content. A new issue is a database row
  first and keeps each folder's ID as it is created, so an issue that Drive stopped halfway is
  _Nedokončené_ and _Dokončit vydání_ adds only what is missing. When Drive fails at the issue
  folder itself, the row is removed in the same request: nothing exists, and the issue can be
  created again under any name. Every other action is all or nothing (`11c`): when Drive fails
  midway, what that one attempt created goes to the shared drive's bin, found by the IDs it
  stored and the attempt's key on each file, never by a name. The app deletes nothing for good,
  never touches what a person made or moved, and never recreates a folder somebody removed: it
  marks it missing, shows it to the editors-in-chief, and a link page that needs it accepts
  nothing until it is back. An e-mail goes only after the action is committed, because a sent one
  cannot be taken back.
- **Two accounts, as `web.app@` in `cz.vednemesicnik`.** `publikace@vednemesicnik.cz` is a mailbox
  and nothing else: it runs the deployments of `SCRIPT__Mail__Send` and `SCRIPT__Mail__Reply_Check`.
  `publikace.app@vednemesicnik.cz` runs everything else and is a Content manager of the shared
  drive _Publikace_, where every new issue lives, and a member of no other shared drive, because
  it holds the full `drive` scope. Files on a shared drive belong to the drive, not to an account.
  The article template is the one exception: `TEMPLATE__Publication__Article` lives in
  `publikace.app@`'s own _Můj disk → Templates_, beside _Scripts_ for its standalone projects.
  It is a Doc without code. On the shared drive every member who writes could change or bin it,
  while there only that account edits it and the app copies it as its owner. The names on that
  drive are English, as the scripts' are, because nobody but that account reads them. The
  scripts' template stays in `publikace@`'s drive until the switch.
- **Three kinds of visitor.** Editors-in-chief sign in with Google, for seven days from the sign-in:
  an account on the domain `AUTHORIZED_DOMAIN` names, listed by name in Settings or a member of
  a Google group listed there. A group is shown by its name from Google Workspace with its address
  under it, or by its address alone while the service has not named it; the name decides nothing.
  Group membership is asked of `SCRIPT__Auth__Group_Membership`,
  re-checked every ten minutes, and an unreachable service denies without remembering the
  denial. Only an administrator, always a named account and never a group, changes who may sign
  in; the first one comes from `INITIAL_ADMIN_EMAIL`, read only while the list has no named
  account. Proofreaders sign in the same way: the account that is the address in Nastavení ›
  Korektura, or a member of that group, checked as a group in Přístup is. The address the morning
  digest goes to is who may act on it, so there is no second list. They see only `/proofreading`,
  across every open issue, and every screen of the editors-in-chief refuses them with 403
  (`10d`); a person may be both. Everybody else arrives through a shared link that can do one thing in one issue
  (`/l/{key}/article`, `/l/{key}/artworks`) and can be revoked.
- **The background jobs stay in Apps Script and talk to the app.** The comment digest
  (`SCRIPT__Publication__Article_Comments`, which reads the Docs' comments and suggestions and mails
  the authors), the print folder (`SCRIPT__Publication__Print_Handoff`, which copies what is approved into
  `_Podklady_pro_tisk` and keeps no state of its own), the artwork reply check
  (`SCRIPT__Publication__Artwork_Replies`, the first of them), the article approvals
  (`SCRIPT__Publication__Article_Approvals`, which sends the final versions and reads the replies)
  and the proofreaders' morning digest
  (`SCRIPT__Publication__Proofreading_Digest`, which only calls the app) run as `publikace.app@`
  on their triggers and read and write through the app's API instead of the sheets. They report
  every run to the app with the interval of their trigger, and the app shows the last one and can
  start a job through the script's `doPost`. Apps Script picks the minute a trigger fires, so a
  next run the app shows is an estimate, never a promise. The app reaches Gmail only through the
  Mailer and the reply check, never with a token of its own. A job the app replaces stays on the
  sheets beside the one that talks to the app, each with its own issues, until no issue made
  before the app is open: `SCRIPT__Publication__Approval_Send` under `publikace@` keeps sending
  the old issues' clauses, `Artwork_Upload` keeps reading their artworks' replies,
  `Designer_Handoff` keeps filling the print folders, and `Comment_Digest` keeps telling the
  authors of the issues on the Registr's _Vydání_ of new comments.
- **The Doc carries only the text; the app carries every state.** Nothing goes into an article
  Doc: no menu, no link, no add-on. A bound script in a template is copied into every Doc and asks
  each person to authorize it in each one, so the steps on an article (the handover, taking and
  cancelling proofreading) are the app's, on its own screens. `SCRIPT__Publication__Article_Approve`,
  bound to the scripts' template, serves the issues made before the app and is never changed
  for it.
- **The link to a Doc is the right to edit it.** The issues folder on the shared drive is shared
  as _Každý, kdo má odkaz · Přispěvatel_ (an editor, in a shared drive’s words), and the drive allows people outside the organisation, so every
  issue, article folder and Doc inherits it, as on _Redakce_. Authors outside the domain edit
  through the link; nothing in the app or the scripts shares a file with a person. Closing an
  issue therefore revokes nothing, the print folder included: only a Manager of the shared drive
  can make a folder limited and cut the inherited grant, and `publikace.app@` stays a Content
  manager.

## Workflow skills

Skills live in `.agents/skills/` and are invoked as `/name`, or simply asked for by what they do.
Claude Code reads them through symlinks in `.claude/skills/` that `pnpm dev:setup-claude` writes,
along with a `CLAUDE.md` whose whole content is `@AGENTS.md` — this file is the one that is
tracked. Subagents are the exception: they are read from `.claude/agents/` and nowhere else, so
that directory is tracked. `ux-designer` answers a design question from a brief and draws it in
the design canvas, for `/ask-design`.

**Before an issue exists**, the subject is an idea:

- **`/discover-idea`** — sweep one area for what is missing: drawn and not built, built and not
  drawn, answered by design and never built, written in the plan and not kept, or two places
  disagreeing.
- **`/review-idea`** — weigh a proposal against product, evidence, design and security. Four
  verdicts: write the issue, ask design first, change the plan, or drop it.

Both read the written design — [docs/product.md](docs/product.md),
[docs/architecture.md](docs/architecture.md), [docs/security.md](docs/security.md) — and every
stage after them keeps it true: the documents change in the PR that changes what they describe,
or on their own when the plan changes without code
([docs/workflow-skills.md](docs/workflow-skills.md) § The written design).

**Once there is an issue**, each one takes its number:

`/plan-issue` → `/implement-issue` → `/ship-issue` → `/next-issue`

**`/ask-design`** and **`/ask-copy`** stand outside both lines: one briefs the `ux-designer`
agent, which answers and draws in the design canvas; the other takes user-facing Czech through a
copywriter with [docs/copy-context.md](docs/copy-context.md) as the whole of the context. Where
each one stops and why: [docs/workflow-skills.md](docs/workflow-skills.md).

## Agent Rules

Mandatory conventions that apply to all tasks. Read the relevant rule file before acting. They
were carried over from billing before this repository had code; their examples cite billing's
files until this one has its own.

- **Comments** — whenever a comment is written or edited: `.agents/rules/comments/RULE.md`.
- **Component Files** — creating a component in `app/ui/`: `.agents/rules/component-files/RULE.md`.
- **Component API** — designing a component's props and parts: `.agents/rules/component-api/RULE.md`.
- **Test Mocks** — a spy on a shared method: `.agents/rules/test-mocks/RULE.md`.
- **Layout Mechanism** — choosing `display` or an element over another: `.agents/rules/layout/RULE.md`.

## House style

- `let` inside function bodies, `const` only for module-level constants (as in billing).
- Comments explain the code **as it stands** — never what it used to be.
- A boolean carries a prefix that makes it a question — `is`, `has`, `can`, `keeps`.
- **Czech in anything a user reads; English in code, identifiers, URL paths, query parameters,
  commit messages and issues.** `/issues/new`, `?state=all`, never `/vydani/nove`.
- **The app's Czech on a screen is written through `` tied`…` ``** from
  `app/domain/public/typography.ts`, which keeps _v, s, k, z, o, u, a, i_ with the next word and
  puts a `${value}` a person typed in as typed. A string that leaves the app (a Drive name, an
  e-mail subject, a sheet cell, an API answer) stays plain; the e-mails tie their own sentences
  with `keepOneLetterWords`. `app/actions/typography.test.ts` sweeps the main pages for a word
  left untied.
- An issue title is a plain English sentence about the problem, never a `type(scope):` subject.
  That form belongs to commits and PR titles, because the squash turns a PR title into a commit
  on `dev`.
- Before an issue is filed, three questions decide it
  ([docs/workflow-skills.md](docs/workflow-skills.md) § Filing an issue): an open issue that
  would carry it gets a comment instead, it is the size of one PR, and until `v1.0.0` one the
  release does not need is labelled `can wait`. The agent decides and files; it does not ask the
  user to pick follow-ups.
- An issue is opened with its type in the same command, `gh issue create --type Bug` (or
  `Feature`, `Task`), whichever skill or session files it. The types are defined in
  [docs/workflow-skills.md](docs/workflow-skills.md). One opened without it gets it at once with
  `gh issue edit <n> --type …`.
- The design's words are Czech and its terms are fixed: _vydání_ (not _číslo_), _obrazové dílo_,
  _poskytovatel_, _souhlas_ — [docs/copy-context.md](docs/copy-context.md) lists them.

## Things that will bite you

**`app/ui/public/ds/` is a copy of the design system, not its source.** The tokens,
`components.css` and the fonts come byte for byte from the design system's artifact
([docs/design-project.md](docs/design-project.md)), and its `README.md` says from which version.
A change goes into the design system first and is copied here after, whole; oxfmt leaves the
folder alone so that a refresh stays a plain copy. A component here writes the design system's
`vdm-*` markup and lets `components.css` style it.

**`oxfmt` formats Markdown too.** The pre-commit hook only globs code, so an unformatted `.md`
commits fine and then fails `format:check` on push. Run `pnpm format` after writing docs.

**`.mcp.json` names one server over HTTP, and three names mean three things.** The repository
`../vdm-dev-exchange-mcp` holds the MCP server and is where it is started from; the server
registers as **`vdm-dev-exchange`**, which is the prefix on every one of its tools; and the room
it serves is `../dev-exchange-room`, a plain folder that is not a repository. `.mcp.json` holds
only `http://127.0.0.1:48000/mcp` and an `Authorization: Bearer ${VDM_EXCHANGE_CLAUDE_TOKEN}`,
so the token stays out of a tracked file. If the tools are missing, check that the server is up
on 48000 and that the key is in your `settings.local.json`.

**A participant reaches the room through `ask_*` and nothing else.** Whatever it must read goes
**into the thread**; `/ask-copy` puts the whole of `docs/copy-context.md` in the opening turn for
exactly this reason. The room being outside is a grant: never hand a participant a path in here.

**The watch is this side's, and so is the close.** `ask_wait` after every turn, held until the
thread closes. A turn that confirms and leaves nothing to ask back is answered by `ask_close` as
the very next call, with a resolution naming where the result is going.

**The background scripts are other repositories.** `SCRIPT__Publication__*` live next to this one
and deploy to Apps Script on their own. The app's API is their contract: a change to what an
endpoint takes or returns is a change in them too, so the API is versioned and a field is never
renamed in place. Each job claims its batch before it acts and confirms it with the batch's key,
so a run that dies between sending an e-mail and reporting it does not send it twice.

**The app's Registr rows are in its own list, _Vydání z aplikace_, never in _Vydání_.** Six
scripts pick their issues from _Vydání_ by _Aktivní_ and follow its _ID tabulky_ into the Evidence,
so an issue made in the app there would have `Approval_Send` send its clauses a second time. The
app renames, writes and protects no list but its own, by name, and puts its protection back
before every write; `_meta.json` keeps `sheetId: null` so that the scripts' upload never writes
into the app's Evidence. The lists merge, if they
do, only at the cutover.

**SQLite triggers mark the record, not the controllers.** `20261130120000_record_queue` marks an
issue's Evidence or the Registr in the same transaction as the change, on the columns the record
shows and no others. A column the record starts to show needs its trigger changed in a new
migration, or it reaches the sheet only with the daily rewrite. A write that keeps failing is a
`[drive] … was not written` line in the log and nothing on a screen (`00d`).

**A trigger runs as the account that created it.** CI pushes code but never installs triggers.
Moving a script to `publikace.app@` means running its `setupTriggers()` as `publikace.app@` and
deleting the old trigger under `publikace@` the same day; two live copies send every e-mail twice.

**A shared link's pages and the API run without the session, the sign-in and CSRF.** `/l/{key}/…`
sets no cookie (`02a`) and a background job sends none to `/api/…`, so `skipWithoutSession()` in
`app/router.ts` takes those middlewares out for both, and the session-backed CSRF token with them.
What protects a link's form is the key in the address, the form's one-time key and the limit of
thirty articles an hour. What protects the API is the job's Google identity token and the job
account it names. A page under `/l/` or `/api/` that needs a session is a sign that it belongs
behind `requireEditor()` or `requireProofreading()` instead.

**The app starts in `createPublikace(environment)`, and nothing under `app/` reads `process.env`.**
`app/publikace.server.ts` checks the configuration before it opens anything, so a misconfiguration
rejects with nothing left running, and it never listens, exits or handles a signal: a host that
serves other sites beside it does that, and `server.ts` is that host for this repository alone. A
variable is read in `app/auth/environment.server.ts` from the record the app was handed, so the host
can pass its own names; one that production requires is added to `checkConfiguration` too.

**`css()` loses to a `vdm-*` class on the same element.** The mixes sit in the cascade layer
`rmx`, and the design system's classes are unlayered, so on one element the class wins whatever
the order. Put the mix on a wrapper, or the value inline.

**A hydrated island's `<input value>` is controlled.** Typing into it is undone on the next
render. An island's inputs take `defaultValue`.

**The API is public, so every call proves who made it.** A call from a script carries a Google
ID token, checked for its signature, its audience and the e-mail of `publikace.app@`. A call from the app to a script's `doPost` or to the Mailer is signed
with a secret that lives only in the Script Properties of a standalone project.

## Data rules

**This repository is public. No real data belongs in it** — not in fixtures, not in tests, not in
comments, not in the design. Authors, providers, e-mail addresses, Drive IDs, folder links and
shared-link keys must be fictional. Addresses are on two reserved `.test` domains, which nobody can
register and no mail can reach: `vednemesicnik.test` for the newsroom (editors-in-chief, groups, the
app's accounts in tests) and `external.test` for everybody outside it (authors, providers, a domain
that is refused). The app's own accounts are the one exception where a screen names them:
`publikace.app@vednemesicnik.cz` and `publikace@vednemesicnik.cz`.

**Never open `.env`.** It will hold live secrets (the Google OAuth client, the key the token of
`publikace.app@` is encrypted with, the secrets for the Mailer and the scripts); on Fly.io they are
`fly secrets`. The token itself is in the database, encrypted: an editor-in-chief connects the
account in Settings, so a revoked token is mended there and not by a deployment.
`.env.example` is the tracked template and documents every variable by name and purpose — read
that instead. Beware of `grep -r` from
the repository root, which reads `.env` before you can filter it out.
