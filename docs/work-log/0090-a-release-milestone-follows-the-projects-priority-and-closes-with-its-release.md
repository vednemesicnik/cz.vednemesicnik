# 0090. A release milestone follows the project's priority and closes with its release

- Date: 2026-11-27

## Context

Publikace's issues are ordered by the org project Publikace (7), whose `Priority` is weighed
against `publikace-v1.0.0`, the release that first runs the app on Fly.io
([0089](0089-every-app-gets-its-own-tags-and-releases-and-one-deploy-remains.md)). On 27 Nov 2026
Libor asked for GitHub's project-management features to be used more fully, and a milestone
`publikace-v1.0.0` was created by hand holding the P1 and P2 issues (#1063, #1082, #1088, #1093).
Nothing in the guides or skills mentioned it, so it would have drifted on the next filed issue.

## Outcome

The milestone is a view of the priority, not a second judgment: an issue with P1 or P2 is in
`publikace-v1.0.0`, one with P3 is not, and whoever sets or changes a priority sets the milestone
in the same step. Skills name the milestone by its title, which `gh issue create` and
`gh issue edit` take, and never by its number. `/next-issue` reports its open and closed count,
and `/release-pr` names the version only once the milestone is empty and closes it after the
merge. The rule is in [docs/\_workflow-skills.md](../_workflow-skills.md) § Ordering by a project,
and the milestone in `apps/publikace/AGENTS.md` § For the workflow skills, Issue weighing.

## What follows

After `publikace-v1.0.0` the priorities need a new release to be weighed against, and that
release gets its milestone in the same edit of the guide. An app without a project (the web)
has no milestone. A reason to revisit: a release whose scope is chosen apart from the priority,
which would make the milestone a judgment of its own.

## Turned down

- **A milestone chosen apart from the priority.** Two fields answering "does the release need
  this?" would disagree on the first issue filed in a hurry.
- **The project's own workflows to keep it in step.** They set a project field on an event, not
  an issue's milestone, so the step stays in the skills that set the priority.
- **The milestone's number in a skill.** It changes with every release; the title is what the
  guide names.
