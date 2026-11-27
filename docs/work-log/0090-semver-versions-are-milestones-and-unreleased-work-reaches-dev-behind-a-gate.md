# 0090. Semver versions are milestones, and unreleased work reaches dev behind a gate

- Date: 2026-11-27

## Context

One release PR and one deploy ship every application, and each has its own tags
([0089](0089-every-app-gets-its-own-tags-and-releases-and-one-deploy-remains.md)). Two things
were left open. Nothing said which issues a semver version is waiting for: Publikace's project
weighs its `Priority` against `publikace-v1.0.0`, and on 27 Nov 2026 a milestone of that name
was created by hand with the P1 and P2 issues (#1063, #1082, #1088, #1093), which nothing in the
guides or skills kept true. And 0089 kept work in progress of one application off `dev`, since
a release takes everything on it; with two applications on one `dev`, that left unfinished work
on long branches. Libor decided on 27 Nov 2026 to plan every semver version as a milestone and
to let unreleased work onto `dev` behind a gate.

## Outcome

**Every semver application plans each version as a milestone titled after its tag**,
`<app>-vX.Y.Z`, and the release whose tag matches closes it. The application's guide says how it
is filled; Publikace fills it from its priorities: every P1 and P2 is in, no P3, and moving an
issue across that line moves it in or out in the same step. Skills name a milestone by its
title, never its number. The web is tagged by date and has none.

**User-visible work not to be released yet merges into `dev` behind a gate**: shown while
`NODE_ENV` is not `production`, hidden in production. Each application has one helper for it
(`isUnreleased()`), so a `git grep` lists every gate; a gated route or action answers 404 in
production; a gated change's migration only adds. The PR that removes the gate turns the work
on, belongs to the version's milestone, and the release carrying it names that version; a
release carrying only gated work gives a semver application the next patch. Work that cannot be
gated goes to a short-lived integration branch, a rare exception with CI extended to it.

The rules are in [docs/\_workflow-skills.md](../_workflow-skills.md) § Planning a version and
[docs/\_branching-model.md](../_branching-model.md) § Unreleased work behind a gate.

## What follows

- `/plan-issue` says whether a change is gated and which issue removes the gate,
  `/implement-issue` and the `implementation-reviewer` check that the server is gated with the
  UI, and `/release-pr` lists the gates in place and those the release adds or removes.
- The first issue that needs a gate writes the helper by its application's rules; none exists
  yet.
- After `publikace-v1.0.0`, Publikace's guide names the next version its priorities are weighed
  against.
- Reasons to revisit: a gate that has to differ per person or per request (a real feature flag
  service), a release whose scope is chosen apart from the priority, or gates that pile up on
  `dev` and stay there for several releases.

## Turned down

- **A milestone chosen apart from the priority.** Two fields answering "does the release need
  this?" would disagree on the first issue filed in a hurry.
- **The project's own workflows to keep it in step.** They set a project field on an event, not
  an issue's milestone, so the step stays in the skills that set the priority.
- **Keeping unreleased work off `dev`** (0089). It held finished parts back on long branches
  and made every change of the other application wait or conflict.
- **Per-version release branches.** A second line of integration beside `dev` for every
  version, with back-merges between them, for what a gate does on one branch.
- **Scattered `process.env.NODE_ENV` checks.** Nothing would list the gates before a release,
  and turning one on could miss a check.
