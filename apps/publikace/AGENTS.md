# cz.vednemesicnik.publikace Agent Guide

The magazine's publishing app on `publikace.vednemesicnik.cz`. [README.md](README.md) explains
what it does; this file is about working in it without breaking something expensive.

## Where the project stands

**Design, no application code yet.** The app is drawn in the design canvas
([docs/design-project.md](docs/design-project.md)) and the open decisions are on its page
`03 K rozhodnutí`. What this repository carries today is the setup shared with
`cz.vednemesicnik` and `cz.vednemesicnik.billing`: the workflow skills, the agent rules, the
designer agent, the PR and issue templates, CI and the hooks. The gates that need code
(`typecheck`, the suite, `remix doctor`) join `lefthook.yaml`, `ci.yml` and the ruleset with the
first code.

## Commands

```sh
pnpm install
pnpm dev:setup-claude # the .claude/skills symlinks, the Remix skill, and a CLAUDE.md importing this file
pnpm lint             # oxlint
pnpm format           # oxfmt --write
pnpm format:check
pnpm design:screen    # one screen out of a saved design file — docs/design-project.md
```

**Node 26 or newer is required**, as in billing: the app will use `Temporal`, `node:sqlite` and
the runtime's own TypeScript stripping (`node scripts/….ts` runs without a build step).

`lefthook` runs lint and format on commit and on push. `postinstall` writes the hooks by running
`lefthook install`, and [pnpm-workspace.yaml](pnpm-workspace.yaml) refuses lefthook's own install
script so that the step reads from this repository. A clone whose hooks never fire had its
install scripts skipped: `pnpm exec lefthook install` is the fix.
[ci.yml](.github/workflows/ci.yml) runs the PR title, the release version, lint and format on every PR into `dev` or
`main`, and the `branch-protection` ruleset requires them. Every merge into `main` is tagged
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
  The database keeps their IDs and links, never their content.
- **Two accounts, as `web.app@` in `cz.vednemesicnik`.** `publikace@vednemesicnik.cz` is a mailbox
  and nothing else: it runs the deployments of `SCRIPT__Mail__Send` and `SCRIPT__Mail__Reply_Check`.
  `publikace.app@vednemesicnik.cz` runs everything else and is a Content manager of the shared
  drive _Publikace_, where every new issue lives, and a member of no other shared drive, because
  it holds the full `drive` scope. Files on a shared drive belong to the drive, not to an account.
- **Two kinds of visitor.** Editors-in-chief sign in with Google: an account on the domain that
  Settings names, or a member of a Google group Settings names. Group membership is asked of
  `SCRIPT__Auth__Group_Membership`, the way Fakturace asks it, re-checked every ten minutes, and
  an unreachable service denies without remembering the denial. Only an administrator, always a
  named account and never a group, changes who may sign in; the first one comes from
  `INITIAL_ADMIN_EMAIL`. Everybody else arrives through a shared link that can do one thing in
  one issue (`/l/{key}/article`, `/l/{key}/artworks`) and can be revoked.
- **The background jobs stay in Apps Script and talk to the app.** `SCRIPT__Publication__Approval_Send`,
  `…__Comment_Digest`, `…__Designer_Handoff` and the artwork reply check run as `publikace.app@`
  on their triggers and read and write through the app's API instead of the sheets. They report
  every run to the app, which shows the last one and can start a job through the script's
  `doPost`. The app reaches Gmail only through the Mailer and the reply check, never with a token
  of its own.
- **The article Doc's menu calls the app.** `SCRIPT__Publication__Article_Approve` is bound to the
  article template, so every Doc carries a copy and anyone who edits the Doc, authors included,
  can read it. It sends the app the Doc's ID and `ScriptApp.getIdentityToken()` of whoever
  clicked, and the app decides by that e-mail whether they may. **No secret goes into a bound
  script.**

## Workflow skills

Skills live in `.agents/skills/` and are invoked as `/name`, or simply asked for by what they do.
Claude Code reads them through symlinks in `.claude/skills/` that `pnpm dev:setup-claude` writes,
along with a `CLAUDE.md` whose whole content is `@AGENTS.md` — this file is the one that is
tracked. Subagents are the exception: they are read from `.claude/agents/` and nowhere else, so
that directory is tracked. `ux-designer` answers a design question from a brief and draws it in
the design canvas, for `/ask-design`.

**Before an issue exists**, the subject is an idea:

- **`/discover-idea`** — sweep one area for what is missing: drawn and not built, built and not
  drawn, answered by design and never built, or two places disagreeing.
- **`/review-idea`** — weigh a proposal against product, design and UX. Three verdicts: write
  the issue, ask design first, or drop it.

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
- An issue title is a plain English sentence about the problem, never a `type(scope):` subject.
  That form belongs to commits and PR titles, because the squash turns a PR title into a commit
  on `dev`.
- The design's words are Czech and its terms are fixed: _vydání_ (not _číslo_), _obrazové dílo_,
  _poskytovatel_, _souhlas_ — [docs/copy-context.md](docs/copy-context.md) lists them.

## Things that will bite you

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

**A trigger runs as the account that created it.** CI pushes code but never installs triggers.
Moving a script to `publikace.app@` means running its `setupTriggers()` as `publikace.app@` and
deleting the old trigger under `publikace@` the same day; two live copies send every e-mail twice.

**The API is public, so every call proves who made it.** A call from a script carries a Google
ID token, checked for its signature, its audience and the e-mail of `publikace.app@` (or of the
person in the Doc menu). A call from the app to a script's `doPost` or to the Mailer is signed
with a secret that lives only in the Script Properties of a standalone project.

## Data rules

**This repository is public. No real data belongs in it** — not in fixtures, not in tests, not in
comments, not in the design. Authors, providers, e-mail addresses, Drive IDs, folder links and
shared-link keys must be fictional; `priklad.cz` is the convention.

**Never open `.env`.** It will hold live secrets (the Google OAuth client, the token of
`publikace.app@`, the secrets for the Mailer and the scripts); on Fly.io they are `fly secrets`.
`.env.example` is the tracked template and documents every variable by name and purpose — read
that instead. Beware of `grep -r` from
the repository root, which reads `.env` before you can filter it out.
