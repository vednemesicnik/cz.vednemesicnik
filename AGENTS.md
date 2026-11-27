# AGENTS.md

Agent guidance for working with code in this repository: the monorepo of the student magazine
Vedneměsíčník's applications. This file holds what is true for the whole repository. Each
application has its own guide, read when the work is inside it:

- **The web** — [apps/web/AGENTS.md](apps/web/AGENTS.md): the public site and its
  administration, React Router v8, Prisma and SQLite.
- **Publikace** — [apps/publikace/AGENTS.md](apps/publikace/AGENTS.md): the newsroom's
  publication app, Remix 3 on `node:sqlite`.

## Repository Layout

A pnpm workspace (`pnpm-workspace.yaml`, `packages: ['apps/*']`), one lockfile:

- **The root is the host**: `server.ts` + `server/`, the Node server that serves every
  application on the Fly machine by `Host`, with `instrument.server.ts` (Sentry), Docker, Fly,
  CI, the backup scripts, the agent setup and the repository docs in `docs/` (deploy, backups,
  branching, work log).
- **The web lives in `apps/web`** (package `web`): the React Router app, its Prisma schema and
  migrations, public files, configs and its own docs in `apps/web/docs/`.
- **Publikace lives in `apps/publikace`** (package `publikace`): a Remix 3 app with its own
  tools (oxlint, oxfmt, `remix test`, `remix doctor`). It is not served yet
  (#1082).

Run commands from the root: its scripts forward to the web (`pnpm app:dev` runs
`pnpm --filter web app:dev`) and to Publikace (`pnpm publikace:test` runs
`pnpm --filter publikace test`), and each application's scripts run with its own folder as the
working directory. In the image the repository sits under `/srv` (`/srv/server.ts`,
`/srv/apps/web`).

**Which app a change belongs to** is decided by its files: `apps/web/**` is the web's,
`apps/publikace/**` is Publikace's, and anything outside `apps/` (the host, CI, Docker, the
agent setup, the repository docs) is the repository's own. An application's rules and tools
bind its folder only.

## Code Editing Workflow

Change existing files with the Edit tool, so every change reaches the user as a reviewable diff in the IDE; use Write only for new files.

## Development Commands

```bash
pnpm install                       # One install for the whole workspace (pnpm 12.18)
pnpm claude:skills:link            # Link the agent skills (see Claude Code Skills)
pnpm lefthook:install              # Install the Git hooks (postinstall does it too)
pnpm biome:check                   # Lint and format check of the root and the web (Biome)
pnpm dedupe --check                # Fail on duplicate versions pnpm dedupe can collapse (CI)
pnpm app:start                     # Run the host over the web's production build
pnpm docker:compose:up             # Start the local Docker containers
pnpm docker:compose:down           # Stop them
pnpm db:backup                     # Back up the production database to the bucket
```

Each application's own commands are in its guide.

When the dedupe check fails, often on a Dependabot PR, run `pnpm dedupe` and commit the
lockfile: two copies of a package such as ProseMirror break at runtime.

Biome formats the root and the web: format with `pnpm exec biome check --write <files>`.
Prettier is installed only as a transitive dependency; running it rewrites files into a style
the repository doesn't use. Publikace formats with its own oxfmt.

### CI

The `branch-protection` ruleset requires checks by job name, so every job is named for
what it checks. `.github/workflows/web.yml` checks the web: `web-lint`, `web-typecheck`,
`web-test`, `web-build`, `web-storybook`. `.github/workflows/publikace.yml` checks Publikace:
`publikace-lint`, `publikace-format`, `publikace-typecheck`, `publikace-test`,
`publikace-doctor`. `.github/workflows/repo.yml` checks what belongs to no application:
`repo-lint` (the lockfile, Biome outside `apps/`), `host-typecheck`, `host-test` and `image`
(the one Docker image). `.github/workflows/release-version.yml` runs `release-version`, the tag
each changed application would get from a PR into `main`, and `release.yml` writes those tags
after the merge (§ Releases). On a pull request each job runs only when its files change: a
`dorny/paths-filter` job and a job-level `if:`, never `on.paths`, since a skipped job passes a
required check and a workflow that never starts leaves it "expected". `deploy.yml` calls every
workflow, with every job running. A new application gets its own workflow, with jobs named
`<app>-…`, and its names go into the ruleset.

### Git Hooks

One `lefthook.yaml` for the repository; each application's commands check its own files with
its own tools. The root `postinstall` runs `lefthook install` (lefthook's own install script is
refused in `pnpm-workspace.yaml`); `pnpm lefthook:install` does it by hand.

### Claude Code Skills

Claude Code discovers project skills only in `.claude/skills/`, which is gitignored. The
skills live in `.agents/skills/` — the repository's at the root, each application's own in
`apps/<app>/.agents/skills/` — and are linked in one symlink per skill:

```bash
pnpm claude:skills:link            # Link every .agents/skills/* into the .claude/skills next to it
```

Run it from the root after cloning, after `pnpm install` (Publikace's `remix` skill is copied
from the installed Remix CLI) and after a pull that adds a skill; in a Claude Code cloud
environment, have the setup script run it. It is idempotent, removes links to deleted skills,
and never replaces a real file or directory in `.claude/skills`, so personal skills can sit
next to the linked ones. Git worktrees under `.claude/worktrees/` pick up the main checkout's
links.

**An application's skills load on demand.** A session started at the root sees the root's
skills at once and an application's (`apps/web/.claude/skills/`, `apps/publikace/.claude/skills/`)
once it reads or edits a file in that folder; a session started inside an application sees both.
The application's `CLAUDE.md` loads the same way.

### Claude Code Subagents

Project subagents are committed in `.claude/agents/` (the one tracked path under `.claude/`),
so worktrees and cloud environments have them without a link step. A session started at the
root reads them from the root only, so there is one of each for every application. A subagent
cannot ask the user anything, so only self-contained work that changes nothing in the
repository goes to one; the interactive pipeline skills stay in the main session.

- `implementation-reviewer` — the pre-PR review for `/review-implementation` and
  `/ship-issue`, in a fresh context, against the rules of the app the diff touches.
- `ux-designer` — answers a design question from a brief and draws it in the design artifacts,
  for `/ask-design`. The brief names the app's design canvas and design project document; the
  design system is shared.

### Branching & Pull Requests

`dev` is the default branch; `main` is production and the only deploy source. Branch
off `dev` in kebab-case with the issue number (e.g. `feat/155-branching-model-dev`) and
target `dev` in the PR. A small follow-up goes straight to a PR without an issue, on a
branch without a number (e.g. `ci/pr-title-check`). Releases (`dev → main`) and hotfixes
target `main`. See `docs/_branching-model.md` for the full flow and merge-method conventions.

### Issues

One repository holds the issues of every application, told apart by labels: `web` for the web,
`publikace` for Publikace, both for the host or the repository's own work (CI, Docker, the agent
setup). Every issue is opened with its organisation type and its label in one command
(`gh issue create --type Bug|Feature|Task --label web|publikace`), and work on an app lists its
own (`gh issue list --label publikace`). A new application gets a label of its own.
Publikace's issues are also ordered by the org project
[Publikace (7)](https://github.com/orgs/vednemesicnik/projects/7) — `Priority` decides, age breaks
a tie — and an application that gets a project names it in its own `AGENTS.md`; the web has
none yet.
[docs/\_workflow-skills.md](docs/_workflow-skills.md) § The issue's type and status has the rest.

### Releases

One Fly app, one image and one deploy for every application: a release is one `dev → main`
PR (`/release-pr`), and every push to `main` deploys all of them. The release title is dated
(`release: 2026-11-26 — …`). Each application still has versions of its own: after every
merge into `main`, `release.yml` tags the merge commit for each application whose folder
changed and publishes a GitHub Release with the commits that touched it. Each application
picks its style in `scripts/release-version.ts`: the web by date (`web-2026-11-27`), Publikace
by semver (`publikace-v1.1.0`), named under `## Versions` in the release PR's body; a hotfix
takes the next patch. The `release-version` check shows every tag before the merge. Publikace
stays untagged until the release that has the host serve it (#1082) names `publikace-v1.0.0`.
Work in progress of one application stays off `dev`, because a release takes everything on
it. [docs/\_branching-model.md](docs/_branching-model.md) § Versions has the rest.

## Documentation

The repository's documents are in `docs/`; each application documents itself in its own
`docs/`.

- `docs/_branching-model.md` - Branching model, merge methods, stacked PRs, hotfix procedure
- `docs/_workflow-skills.md` - The map of the workflow skills: what each takes and ends with, issue type and status, filing an issue, where each stops, where the skills live
- `docs/_deploy-to-fly.md` - Deployment instructions
- `docs/_manual-database-backup.md` - Database backup procedures
- `docs/_manual-database-restore.md` - Database restore procedures
- `docs/work-log/` - Numbered work log for the whole repository: what the work settled on, when
  and why, and what was turned down; context, not rules (index and format in `README.md`,
  template in `_template.md`)

## Environment

Node.js >= 26.0.0 required (see `engines.node` in `package.json`; `.nvmrc` pins the major to
`26`), pnpm 12.18 (`packageManager`). Each application reads its own `.env` in its folder (see
its `.env.example`).

## Agent Skills

Load only the skills that apply to your current task. The repository's skills are below; each
application lists its own (stack and guidance skills) in its guide.

### The Workflow Skills

From an idea to a merged PR, one issue per context window:
`/discover-idea` → `/review-idea` → `/plan-issue` → `/implement-issue` → `/ship-issue` → `/next-issue`.

One copy serves both applications. A skill decides which app the issue belongs to and reads
that app's `AGENTS.md` § For the workflow skills for everything that differs: its gates, its
product and design documents, its design canvas, its copy context, its commit scopes, how to
see a change and the rules that bind its code.

- `.agents/skills/discover-idea/SKILL.md` — sweep one area for evidenced gaps (design vs. app, unbuilt design answers, disagreements); weighs nothing.
- `.agents/skills/review-idea/SKILL.md` — weigh a proposal before it becomes an issue; a well-argued no is a result.
- `.agents/skills/plan-issue/SKILL.md` — plan-mode implementation plan, saved to `~/.claude/plans/plan-issue-<n>-<slug>.md`.
- `.agents/skills/implement-issue/SKILL.md` — execute the approved plan on a feature branch; stops before the PR.
- `.agents/skills/review-implementation/SKILL.md` — the pre-PR review on its own (report-only), by the `implementation-reviewer` agent.
- `.agents/skills/ship-issue/SKILL.md` — review, PR, Copilot loop, green CI, then ask and merge.
- `.agents/skills/next-issue/SKILL.md` — after the merge: aftermath, handoff, pick the next issue.
- `.agents/skills/release-pr/SKILL.md` — cut a release: the `dev → main` PR, the deploy, the back-merge.

What the work settles that later work should know gets an entry in `docs/work-log/`, for either
application:

- `.agents/skills/log-work/SKILL.md` — write a numbered work-log entry, or log a change of direction from an earlier one; `/plan-issue`, `/review-idea` and `/next-issue` ask whether one is due.

### Design and Copy

Loops for decisions this repository does not own. Load when a screen, component or token needs
a decision from the design project, when a design document comes back with open questions, or
when user-facing Czech needs a copywriter. The design system is shared; each application has its
own design canvas, design project document and copy context, named in its guide.

- `.agents/skills/ask-design/SKILL.md` — brief the `ux-designer` agent, which answers and draws in the app's design project, read the answer back (`check`), retire settled questions (`tidy`).
- `.agents/skills/ask-copy/SKILL.md` — take strings through the copywriter in the shared room (`vdm-dev-exchange` in `.mcp.json`). Every thread opens with the whole of the app's copy context document.

### Modern Web Guidance

A search tool for modern web development best practices, for both applications. **Execute first** for all HTML/CSS and client-side JS tasks — web APIs evolve rapidly and training weights contain obsolete patterns.

**Trigger for:** UI/layout (modals, dialogs, popovers, anchor positioning, container queries, `:has()`), scroll/motion (View Transitions, scroll-driven animations), performance (CWV, image optimization), forms/autofill, passkeys, and general frontend patterns.

**Do not trigger for:** backend (SQL, ORMs, API routes), CI/CD pipelines, or generic scripts.

**Usage — two steps:**

```sh
# Step 1: search for relevant use cases
npx -y modern-web-guidance@latest search "<query>" --skill-version 2026_11_09-5bcc021b

# Step 2: retrieve the full guide by id from step 1
npx -y modern-web-guidance@latest retrieve "<id>"
```

If search returns no matches or low similarity scores, list all available guides:

```sh
npx -y modern-web-guidance@latest list
```

## Agent Rules

Mandatory conventions. Read the relevant rule file before acting. A rule is one short
convention with a single trigger; guidance made of several references for one body of work,
such as building UI, is a skill (log 0014).

**A rule binds the folder it sits in.** The four below, in `.agents/rules/`, bind the whole
repository. Each application's own rules sit in `apps/<app>/.agents/rules/` and bind its code
only — the web's (`one-function-per-file`, `functional-style`, …) never apply to Publikace, nor
Publikace's to the web. Each application's guide lists its rules.

### Package Versions

Applies when installing or updating packages, or editing any `package.json` dependencies directly.

Read `.agents/rules/package-versions/RULE.md` before acting.

### Generic Guidance Examples

Applies when writing or editing a rule, a skill, or the conventions in an `AGENTS.md`.

Read `.agents/rules/generic-guidance-examples/RULE.md` before acting.

### Self-Review Before PR

Applies when opening a pull request or requesting an automated/Copilot review.

Read `.agents/rules/self-review-before-pr/RULE.md` before acting.

### Decide and Inform

Applies when about to ask the user an architecture, product, security or process question,
or which of several approaches to take.

Read `.agents/rules/decide-and-inform/RULE.md` before acting.
