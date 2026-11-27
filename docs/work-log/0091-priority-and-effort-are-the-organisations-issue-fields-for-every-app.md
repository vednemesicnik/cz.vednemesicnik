# 0091. Priority and Effort are the organisation's issue fields, for every app

- Date: 2026-11-27

## Context

Only Publikace had a priority: the org project Publikace (7) carried a `Priority` field with P1,
P2 and P3, and its milestone `publikace-v1.0.0` held the P1 and P2 issues
([0090](0090-semver-versions-are-milestones-and-unreleased-work-reaches-dev-behind-a-gate.md)).
The web had none, so `/next-issue` could order its 25 open issues by age alone. Nothing
recorded an issue's size, though the size rule of `docs/_workflow-skills.md` § Filing an issue
already splits work too big for one PR.

The organisation `vednemesicnik` already defines two issue fields on every issue of its
repositories, `Priority` (Urgent, High, Medium, Low) and `Effort` (High, Medium, Low), visible to
its members only. No issue had values. The REST API reads and writes them per issue
(`repos/{owner}/{repo}/issues/<n>/issue-field-values`, a value given by the option's name), and the
issue list returns them on every issue.

## Outcome

The two issue fields are the one source of priority and size for every issue of every
application. Priority: Urgent is production broken (a hotfix), High is what the application's next
release needs now (Publikace's old P1), Medium is needed for the planned version but not blocking
(P2), Low can wait (P3). Effort: Low fits one session, Medium is one issue from plan to merge,
High is a large PR at the edge of reviewable; anything bigger is an epic. Each application's
Issue weighing says what its priorities mean; `docs/_workflow-skills.md` § Priority and effort
has the shared meaning and the commands.

A semver application's milestone holds its issues with High or Medium, none with Low.
Whoever files an issue sets both fields; `/plan-issue` corrects Effort from the plan;
`/next-issue` orders by Priority, then age, and shows Effort beside each candidate.

Project 7 stays as Publikace's board. Its own `Priority` field is retired: every item of the
project got the issue field from its P-value on 27 Nov 2026, and nothing reads the old field. No
skill writes a project field any more; the project's own workflows move its Status.

## What follows

- The skills look the field's id up by its name each time. A renamed field or option breaks them
  until the commands in `docs/_workflow-skills.md` follow.
- The fields are visible only to organisation members. A reader outside the organisation sees no
  priority; that would be a reason to revisit if the repositories took outside contributors.
- The first web triage (27 Nov 2026) set High only on the donate page in review (#104), Medium on
  its confirmation flow (#1058) and on the Medium import planned for Christmas (#738), and Low on
  the rest.

## Turned down

- **The project's Priority field for both applications.** It lives on one project, so the web
  would need a project of its own only to hold a priority, and a skill needs three ids to set it.
  The issue field sits on the issue in every repository and every view.
- **Labels such as `priority:high`.** Nothing keeps two of them off one issue, and they mix
  with the application labels.
- **Effort in story points or hours.** Nobody estimates in them here; three sizes tied to the
  line of skills say what a session needs to know.
