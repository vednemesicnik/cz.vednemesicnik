# 0096. Only a major version is planned as a milestone

- Date: 2026-11-27
- Issues: #1111

## Context

[0090](0090-semver-versions-are-milestones-and-unreleased-work-reaches-dev-behind-a-gate.md)
planned every semver version as a milestone, and
[0091](0091-priority-and-effort-are-the-organisations-issue-fields-for-every-app.md) had the
Priority fill it: every _High_ and _Medium_ in, no _Low_. Its first milestone, `publikace-v1.0.0`, was closed by the release
of 27 Nov 2026, and `publikace-v1.1.0` was tagged the same day with no milestone at all. The
guide still weighed every issue against the shipped `v1.0.0`, and every open Publikace issue was
_Low_, so the next milestone would have been empty (#1111). On 27 Nov 2026 Libor decided:
"Milník dává smysl u major verzí u nás" (a milestone makes sense for our major versions).

`v1.0.0` was described as the release that "lets the newsroom switch the scripts off". That was
never a release's to give: the newsroom moves to the app only once the round trip against the
real Drive has passed locally and in production, and the scripts serving the issues made before
the app run until none of them is open
([apps/publikace/docs/product.md](../../apps/publikace/docs/product.md) § Old issues and the
cutover).

## Outcome

**Only a major is planned as a milestone**, `<app>-vX.0.0`, created by the first issue whose
work needs it. An issue joins it when its work is part of the major, whatever its Priority, and
the release that names the major closes it. A patch or a minor is not planned: the release
names it by what it carries. Priority puts nothing into a milestone.

**Publikace weighs its Priority against the newsroom's move to the app**: new issues are created
in the app instead of through the scripts. _High_ is what keeps the newsroom from moving,
_Medium_ what the move needs but does not yet block on, and _Low_ what the newsroom would move
without. The scripts that serve the older issues stop when the last of those closes, and nothing
is weighed against that.

The rules are in [docs/\_workflow-skills.md](../_workflow-skills.md) § Planning a version and
[docs/\_branching-model.md](../_branching-model.md) § Versions, and Publikace's weighing is in
[apps/publikace/AGENTS.md](../../apps/publikace/AGENTS.md) § For the workflow skills.

## What follows

- The 0090 gate, the expand-then-contract migrations and the patch, minor and major rules stand
  as they were. Only the milestone per version is gone.
- `/next-issue` reports a milestone's progress only while a major is open; `/release-pr` closes
  only a major's milestone.
- Once the newsroom has moved, Publikace's guide names what its priorities are weighed against
  next.
- Reasons to revisit: a minor that has to wait for several issues together, or a release whose
  scope people want to see before the day it ships.

## Turned down

- **A milestone for the next minor.** It would be empty or hold one issue, and every _Low_
  would have to be weighed against a number nobody plans.
- **Weighing against the cutover**, the scripts switched off. It comes when the last issue made
  before the app closes, so it measures the print calendar, not the app.
