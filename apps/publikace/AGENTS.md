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

**Node 26 or newer is required**, as in billing: the app will use `Temporal` and the runtime's
own TypeScript stripping (`node scripts/….ts` runs without a build step).

`lefthook` runs lint and format on commit and on push. `postinstall` writes the hooks by running
`lefthook install`, and [pnpm-workspace.yaml](pnpm-workspace.yaml) refuses lefthook's own install
script so that the step reads from this repository. A clone whose hooks never fire had its
install scripts skipped: `pnpm exec lefthook install` is the fix.
[ci.yml](.github/workflows/ci.yml) runs the PR title, lint and format on every PR into `dev` or
`main`, and the `branch-protection` ruleset requires them. See
[docs/branching-model.md](docs/branching-model.md).

## What the app will be

- **Remix 3 on Cloudflare Workers.** The same framework as Fakturace, deployed to Cloudflare
  rather than Fly.io. Refer to `./.agents/skills/remix/SKILL.md` (the `remix` skill) once
  `pnpm dev:setup-claude` has copied it.
- **Google Drive is the source of truth.** The Registr (list _Vydání_) and each issue's Evidence
  (_Články_, _Redakční doložky_, _Obrazová díla_) stay where the background scripts read them.
  The app keeps a cache of them in D1 and writes every change to the sheet first. A second copy
  of the truth is what this rules out.
- **Two accounts act.** `publikace.app@vednemesicnik.cz` creates folders, documents and rows and
  owns them; `publikace@vednemesicnik.cz` sends the e-mails and reads the replies.
- **Two kinds of visitor.** Editors-in-chief sign in with Google (domain and an allowlist).
  Everybody else arrives through a shared link that can do one thing in one issue
  (`/l/{key}/article`, `/l/{key}/artworks`) and can be revoked.
- **The background scripts stay.** `SCRIPT__Publication__Approval_Send`, `…__Designer_Handoff`,
  `…__Comment_Digest` and the reply checks keep running on their triggers; the app shows their
  last run and can start them.

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
and deploy to Apps Script on their own. A change to what the Evidence holds is a change in them
too, and their column names are read by header — rename one and the scripts stop finding it.

## Data rules

**This repository is public. No real data belongs in it** — not in fixtures, not in tests, not in
comments, not in the design. Authors, providers, e-mail addresses, Drive IDs, folder links and
shared-link keys must be fictional; `priklad.cz` is the convention.

**Never open `.env`.** It will hold live secrets (the Google OAuth client, the tokens of
`publikace.app@` and `publikace@`, Cloudflare credentials). `.env.example` is the tracked template
and documents every variable by name and purpose — read that instead. Beware of `grep -r` from
the repository root, which reads `.env` before you can filter it out.
