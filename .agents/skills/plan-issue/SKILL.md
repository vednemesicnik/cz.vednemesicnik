---
name: plan-issue
description: Fetch a GitHub issue and produce a repo-aware implementation plan (plan mode). Use when an issue is about to be worked on and needs a plan before any code is written.
argument-hint: <issue-number>
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh api repos/{owner}/{repo}/issues/*), Bash(gh api -X PATCH repos/{owner}/{repo}/issues/*), Bash(gh api orgs/vednemesicnik/issue-fields)
---

## Requested issue number

`$ARGUMENTS`

## Issue

!`gh issue view $ARGUMENTS 2>/dev/null || echo "NO_ISSUE_NUMBER — no issue number was provided"`

## Comments

!`gh issue view $ARGUMENTS --comments 2>/dev/null || true`

## Open issues (fallback list)

!`gh issue list --limit 20 --json number,title,labels --template '{{range .}}{{.number}}  [{{range .labels}}{{.name}} {{end}}]  {{.title}}{{"\n"}}{{end}}'`

## Task

You are the **planning stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → **`/plan-issue`** → `/implement-issue` → `/ship-issue` → `/next-issue`.

1. **Handle a missing argument.** If "Requested issue number" is empty, the issue block has
   errored — do not plan. Show the "Open issues" list and ask which one to plan
   (`/plan-issue <number>`). Otherwise ignore the fallback list.

2. **Check it was weighed before you plan how.** Not every issue came through `/review-idea`,
   and two questions are the ones a plan cannot recover from:
   - **Does anything produce the data the issue consumes, and does that thing exist?**
   - **If the record is missing, does its absence mean anything?**

   A "not drawn yet — do not invent it here" note that names the _producer_ is a blocker
   wearing the clothes of a scope note. If either question comes out badly, **stop and say so
   before planning** and offer `/review-idea` instead. Weighing whether the issue should exist
   is not this skill's job; noticing that nobody did is.

3. **Enter plan mode.** If the session is not already in plan mode, call `EnterPlanMode`
   before anything else.

4. **Explore — and read it yourself unless you cannot.** Decide which app the issue belongs
   to by the files it will touch (`apps/web/**`, `apps/publikace/**`, or the repository's own
   outside `apps/`). Read the root `AGENTS.md`, then that app's `AGENTS.md` — where a change
   belongs is often decided there alone — and from its § For the workflow skills:
   - **Rules** — the rule files and guidance skills for the file types the change touches;
   - **Written design** — the sections the issue touches (a state, a rule, a limit, a table, a
     flow, a job, a boundary, a field about a person), and the findings of the newest dated
     review document it resolves, when the app has one. They are the plan the change has to
     fit or, where the issue says so, the plan it changes. A plan that departs from them
     without the issue saying why has found a question, not an answer: name it and offer
     `/review-idea` on it.

   When the issue names a parent epic, read the epic too — it holds constraints the
   sub-issue leaves out. Prefer reusing existing functions and components over proposing new
   code.

   **Subagents are the exception, not the method.** Most issues name the function and the
   file, and a `grep` plus a `sed -n` answers them for a fraction of what an agent costs — the
   agent pays twice, once to read and once for what it hands back. Before spawning one, say
   which of these is true; if neither is, do it yourself:
   - the scope is genuinely unknown — you cannot name the file to open;
   - the answer needs sweeping many files or several naming conventions.

   A design document is not on that list, however large it is: step 5 reads one screen of it
   here. When an agent is warranted, its brief is **one named target and one question**, plus
   the shape of the answer and what not to return — "return the decision note under the
   consent heading of screen `13a`, verbatim" is a brief; "map everything around the picker"
   is how a plan that needed a fifth of it pays for all of it. One agent with a narrow brief
   beats three with wide ones, and beats one with a five-part questionnaire.

5. **Read the design, not the issue's paraphrase of it.** When the issue touches a screen,
   open the app's design project (its § For the workflow skills, **Design project**): the
   canvas for screens, the design system for a token or a component. A component card lags
   the screens, so check the screen documents too before concluding the design is silent.

   **The unit of a screen document is the screen ID, never the file.** A document runs to
   tens of thousands of tokens and a plan needs one screen of it. Read it **here, in this
   session, never in a subagent**: `Artifact` `read` with its `path` saves the file without
   putting it into the conversation, and the app's screen cutter (named under **Design
   project**) prints one screen by its ID with its decision notes. Where the design is silent
   or two screens disagree, say so in the plan and point at `/ask-design` rather than
   inventing the answer.

6. **Draft the plan** with these sections:
   - **In short** — what the approval is actually read from, so it comes first and stays
     short: what changes from what to what, why now, and a handful of bullets pointing at
     what deserves a second look (a false premise in the issue, a decision that contradicts
     existing code, scope past the issue's examples, a migration, a change of direction from
     a work-log entry). Each bullet names the section that carries the detail. **Added, never
     traded for**: nothing is thinned out of what follows to make room for it.
   - **Context** — issue URL and a short summary of the problem and intended outcome.
   - **Acceptance criteria** — the issue's checkboxes, or an explicit list when it is prose.
     Quote a design decision rather than paraphrase it.
   - **Scope** — what changes, what stays out.
   - **The written design** — which sentences of the app's **Written design** the change makes
     untrue and their new wording, and which review finding it resolves. These edits are
     implementation steps like any other, landed in the same PR. When none is touched, say so
     in a line: that is a claim the review in `/ship-issue` checks.
   - **Release** — whether the change is user-visible work not to be released with the next
     release, and so goes behind the app's **Release gate** (UI and server alike), and which
     issue removes the gate; a change that cannot be gated says why, and so does one that
     ships ungated ([docs/\_branching-model.md](../../../docs/_branching-model.md)
     § Unreleased work behind a gate). When this issue is the one that removes a gate, say so.
     A migration only expands; one that drops or narrows what production still reads is split
     out as a contract issue of its own, filed into the same or the next milestone, to ship in a
     later release than the turn-on (§ Migrations: expand, then contract).
   - **Implementation steps** — concrete files, referencing existing utilities to reuse.
     Read `docs/work-log/` for the area first. When the plan settles something later work
     should know (see `/log-work`), its last step writes the entry in the same PR; a plan that
     changes direction from an entry says so and why in **In short**, and logs the change.
   - **Verification** — the app's **Gates**, plus how to see it (**Seeing a change**) when the
     change is user-visible, naming any check only the user can make.

7. **Respect the repository's conventions** in the plan:
   - branch `feat/<issue-number>-<kebab-slug>` (`fix/…` for bugfixes) off `dev`
     ([docs/\_branching-model.md](../../../docs/_branching-model.md));
   - the app's **Rules** and **Traps** — a migration that has already run is never edited, so
     plan a new one, and a consent-guarded command is a step the user confirms;
   - Czech for anything a user reads, English for code, comments and commits;
   - no real data: e-mail addresses on `vednemesicnik.test` for the newsroom and
     `external.test` for everybody else;
   - Conventional Commits with the app's **Commit scopes** — **the PR title included**: a
     multi-commit squash puts the PR title on `dev`; an issue title is a plain sentence, never
     one. Issue and PR text in English.

8. **Present the plan for approval** with `ExitPlanMode`. Write no file before this — plan
   mode blocks writes, and an earlier write skips the approval step.

9. **Save the plan file** once approved: `~/.claude/plans/plan-issue-<number>-<slug>.md`.

   **Move the issue to _Todo_**: read its status with
   `gh api repos/{owner}/{repo}/issues/<number> --jq .status.name`, and only when it is
   _Backlog_ or empty, set it with
   `gh api -X PATCH repos/{owner}/{repo}/issues/<number> -f status=Todo --jq .status.name`. A
   plan redrawn for an issue already _In progress_ or _In review_ never moves it back
   ([docs/\_workflow-skills.md](../../../docs/_workflow-skills.md) § The issue's type and
   status).

   **Set the issue's Effort from the plan**: read it with
   `gh api repos/{owner}/{repo}/issues/<number>/issue-field-values`, and when the plan's size
   says otherwise (or the issue has none), set it as
   [docs/\_workflow-skills.md](../../../docs/_workflow-skills.md) § Priority and effort shows,
   naming the old and new value in the report. A plan bigger than _High_ is not a value to set:
   say so before `ExitPlanMode` and propose the split into an epic instead.

   The plan file, the status and the Effort are the only things this skill writes — no repo
   edits, nothing else on GitHub.

10. **Close with what is open, in the order it should be done.** `/implement-issue <number>`
    is **one item on that list, not the list.** Planning turns up things beside the plan — a
    false premise, a question routed to `/ask-design`, an issue this one blocks. End with a
    short numbered list, most important first, one or two lines each (what, what it waits on,
    the command that starts it). Say plainly when the honest first item is not implementing.
    Offer the top one as a question answerable in a word. Three or four items is a list; ten
    is a backlog, and the backlog is `gh issue list`.
