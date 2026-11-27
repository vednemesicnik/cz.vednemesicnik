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
(`isUnreleased()`), so a `git grep` lists every gate, and a gated route or action answers 404
in production. The PR that removes the gate turns the work on, belongs to the version's
milestone, and the release carrying it names that version. Work that cannot be gated goes to a
short-lived integration branch, a rare exception with CI extended to it.

**Migrations go expand, then contract**, since they run on every deploy: add the new structure
beside the old, switch the gated code to it, stop reading the old one in the turn-on PR, and
drop it in a contract issue that ships in a later release than the turn-on, so the previous
image still runs after a rollback. A schema whose old and new shape cannot coexist takes the
integration branch, with a backup first.

**A semver version moves by what the release does to its users**: a patch for fixes or gated
work only, a minor when something new is turned on that nobody has to change for, a major when
users relearn something, an API others call breaks, or a data migration needs somebody to act,
planned as its own milestone and turned on by the release that names it. Semver suits an
application that plans versions as milestones, which need a name before the day is known; the
web ships with no plan per version and stays tagged by date.

The rules are in [docs/\_workflow-skills.md](../_workflow-skills.md) § Planning a version and
[docs/\_branching-model.md](../_branching-model.md) § Unreleased work behind a gate.

## What follows

- `/plan-issue` says whether a change is gated and which issue removes the gate, and splits a
  destructive migration out as a contract issue; `/implement-issue` and the
  `implementation-reviewer` check that the server is gated with the UI; `/release-pr` lists
  the gates in place and those the release adds or removes.
- Publikace's contract steps need its backup, which arrives with #1082; the web's deploy takes
  a pre-migration backup already.
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
- **Dropping the old structure in the turn-on release.** A rollback to the previous image would
  meet a schema it cannot read.
- **Date tags for Publikace too.** A milestone could not be named before its release day.
- **Runtime feature flags** (an environment variable, a database setting or a flag service). A
  feature turns on for everyone at once, in the release that names its version, so turning it
  on without a deploy or for part of the users is not needed yet, and `NODE_ENV` is enough.
  Revisit when a feature should turn on without a release or for testers in production; then
  turning it on for everyone is still a PR that flips the default, whose release names the
  version, and a later PR removes the flag.
- **Scattered `process.env.NODE_ENV` checks.** Nothing would list the gates before a release,
  and turning one on could miss a check.
