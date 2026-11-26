# 0088. One agent setup serves both applications and reads each app's guide

- Date: 2026-11-26
- Issues: #1079, #1063

## Context

When Publikace joined ([0087](0087-publikace-joins-as-apps-publikace-with-its-history-and-its-own-tools.md)),
it brought its own copy of the agent setup. The two sets of workflow skills had forked from one
source: the web's from 12 Nov, Publikace's from 25 Nov. Each app had its own rules and its own
`ux-designer`, and each `AGENTS.md` assumed it was the whole repository. The web's rules sat at
the root, where they read as binding Publikace too. Claude Code reads `.claude/agents/` only
from the root, so Publikace's designer was never found.

## Outcome

**One copy of each workflow skill, at the root, took the better version of each part.** Libor
asked for the best of both rather than either one as a base. The two versions were compared
section by section, and he approved the choices before anything was written. The comparison is in
the PR. Where a skill needs something that differs between the apps, it decides the app from the
issue's files and reads that app's `AGENTS.md` § For the workflow skills. That section has the
same nine items in both apps: Gates, Seeing a change, Written design, Design project, Copy
context, Commit scopes, Rules, Issue weighing, Traps.

Libor's choices (26 Nov):

- **Review and Copilot.** The pre-PR review is the `implementation-reviewer` subagent for both
  apps. `pull-request-workflow` is folded into `ship-issue`, and Copilot is requested for both.
- **Issue status.** The skills set the issue Status (Todo, In progress, In review, Done) for both.
- **Follow-ups.** The agent files follow-ups itself after the three questions of
  [docs/\_workflow-skills.md](../_workflow-skills.md) § Filing an issue. `can wait` is Publikace's
  until its v1.0.0.
- **Risky fixes.** They are decided and reported, except auth, 2FA, session and an applied
  migration, which are always asked.
- **Next work.** It starts with open loops; the app's issue weighing orders new issues.
- **Release.** `/release-pr` is its own root skill.

**Each skill, rule and guide sits where it binds.**

- Root: the workflow skills, `log-work`, `release-pr`, `review-implementation`,
  `modern-web-guidance`, four shared rules (package versions, guidance examples, self-review,
  decide and inform), both subagents and the monorepo guide.
- `apps/web`: React Router, Prisma, `general-guidance`, `component-authoring`, its seven rules,
  its `AGENTS.md` and a `CLAUDE.md` importing it.
- `apps/publikace`: `remix`, its seven rules, its `AGENTS.md` and `CLAUDE.md`.

Claude Code loads an app's skills and `CLAUDE.md` once it touches a file in that folder. One
`pnpm claude:skills:link` links them all. Rules crossed over where one app's was better: the
comments rule went to the web, and the component-API order, no-layout-shift and CSS-before-JS
went to Publikace.

## What follows

- A new application adds its `AGENTS.md` with the nine items. The skills need no change.
- `ux-designer` takes the app, its canvas, its design project document and its screen cutter
  from the brief. Facts specific to one canvas go into that app's design project document, never
  into the agent.
- Publikace's `test-mocks` rule may describe a trap that `@remix-run/test` 1.2.0 has fixed. It is
  unchanged until a test shows it.

## Turned down

- **Publikace's skills as the base, with the web's differences ported in.** Libor asked for the
  better version per part instead; recency and length decide nothing.
- **Nested `.claude/agents/` per app.** A session started at the root does not read them.
