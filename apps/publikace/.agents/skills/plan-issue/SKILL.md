---
name: plan-issue
description: Fetch a GitHub issue and produce a repo-aware implementation plan (plan mode). Use when an issue is about to be worked on and needs a plan before any code is written.
argument-hint: <issue-number>
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh api repos/{owner}/{repo}/issues/*), Bash(gh api -X PATCH repos/{owner}/{repo}/issues/*)
---

## Requested issue number

`$ARGUMENTS`

## Issue

!`gh issue view $ARGUMENTS 2>/dev/null || echo "NO_ISSUE_NUMBER — no issue number was provided"`

## Comments

!`gh issue view $ARGUMENTS --comments 2>/dev/null || true`

## Open issues (fallback list)

!`gh issue list --limit 20`

## Task

You are preparing an implementation plan for the GitHub issue shown above.

1. **Handle missing argument.** If the "Requested issue number" above is empty (no number
   was given), the issue view block will have errored — do not plan yet. Show the "Open
   issues" list and ask which one to plan (`/plan-issue <number>`). Otherwise ignore that
   fallback list and plan the requested issue.

2. **Check it was weighed before you plan how.** Not every issue came through
   `/review-idea`, and the two questions that round exists for are the ones a plan cannot
   recover from:

   - **Does anything produce the data the issue consumes, and does that thing exist?**
   - **If the record is missing, does its absence mean anything?**

   A `Not drawn — do not invent it here` section naming the _producer_ is the loud case:
   that is a blocker wearing the clothes of a scope note. #159 carried exactly that
   sentence, was planned and built anyway, and was closed as _not planned_ the same day.

   If either question comes out badly, **stop and say so before planning** — offer
   `/review-idea` on the proposal instead. Weighing whether it should exist is not this
   command's job, but noticing that nobody did is.

3. **Enter plan mode.** If the session is not already in plan mode, call `EnterPlanMode`
   before doing anything else, so this works even when invoked outside `/plan`.

4. **Explore — and read it yourself unless you cannot.** Read `AGENTS.md` first; it says
   where a change belongs, and half of these plans are decided by that section alone. Then
   `.agents/skills/remix/SKILL.md` for anything touching routes, controllers, middleware or
   `remix/ui` components, and the `modern-web-guidance` search for HTML, CSS and
   client-side JavaScript. Prefer reusing existing functions and components over proposing
   new code.

   **Subagents are the exception here, not the method.** Most issues in this repo name the
   function and the file, and a `grep` plus a `sed -n` answers them for a fraction of what
   an agent costs — the agent pays twice, once to read and once for what it hands back.
   Before spawning one, say which of these is true; if none is, do it yourself:

   - the scope is genuinely unknown — you cannot name the file to open;
   - the answer needs sweeping many files or several naming conventions.

   A design document is not on that list, however large it is — step 5 reads one screen of it
   here, for a fraction of what an agent pays to read all of it.

   When one is warranted, its brief is **one named target and one question**, plus the shape
   of the answer and what not to return. "Vrať rozhodnutí u _Je to souhlas_ na `13a`, doslova" is the
   brief; "map everything around the picker" is how a plan that needed a fifth of it pays
   for all of it. One agent with a narrow brief beats three with wide ones — and beats one
   with a five-part questionnaire, which is three agents wearing one hat.

5. **Read the design, not the issue's paraphrase of it.** Issues here cite design
   documents by name and anchor (`12-Detail-vydani.dc.html` / `12a`, `21-Obrazova-dila.dc.html` / `21b`). Read them
   from the design canvas, and a token or a component from the design system's —
   [docs/design-project.md](../../../docs/design-project.md) has both links. A component card
   lags the screens, so check the screen documents too before concluding the design is
   silent. Where it genuinely is silent or two screens disagree, say so in the plan and
   point at `/ask-design` rather than inventing the answer.

   **The unit of a screen document is the screen id, never the file.** A `.dc.html` runs to
   tens of thousands of tokens and a plan needs one `12b` out of it. Read it **here, in this
   session**: `Artifact` `read` with its `path` saves it to a file without putting it into the
   conversation, so the document costs nothing until you ask for a part of it. Then
   `pnpm -s design:screen "<saved file>" 12b` prints that screen with its decision notes,
   `--notes` only the notes, `--html` the markup when a grid or a style is the question, and
   a component card comes out by name. The recipe, and why no subagent can do it:
   [docs/design-project.md](../../../docs/design-project.md).

6. **Draft the plan** with these sections:
   - **In short** — the whole plan is written to be executed from, which is more than is
     needed to say yes to it. This section is what the approval is actually read from, so it
     comes first and stays short: what changes from what to what, why it is being done now,
     and then a handful of bullets pointing at what deserves a second look — a premise of the
     issue that turned out to be false, a decision that contradicts a comment already in the
     code, scope that reaches past the issue's own examples, a new file where the repo has
     none. Each bullet names the section below that carries the detail. **Added, never
     traded for**: nothing is thinned out of what follows to make room for it.
   - **Context** — issue URL + short summary of the problem and intended outcome.
   - **Acceptance criteria** — issues here are written as prose, not checkboxes. Restate
     what "done" means as an explicit list, so the later stages have something to check
     against. Where the issue names a design decision, quote it rather than paraphrase.
   - **Scope** — what changes, what stays out of scope.
   - **Implementation steps** — concrete files to touch, referencing existing utilities to
     reuse.
   - **Verification** — `pnpm typecheck` and `pnpm test`, plus how to see it in the app
     when the change is user-visible.

7. **Respect the repo's conventions** in the plan:
   - branch `feat/<issue-number>-<kebab-slug>` (`fix/…` for bugfixes), off `dev`;
   - where a change belongs as `AGENTS.md` says it (the app's SQLite database is the source of
     truth, Drive holds the files, the Apps Script jobs go through the app's API; a rule about issues, articles or artworks is domain code, not UI);
   - `let` inside function bodies, `const` only for module-level constants;
   - Czech in anything a user reads, English in code, identifiers and commit messages;
   - dates are `Temporal`;
   - **a migration that has already run is never edited** — plan a new one
     ([docs/migrations.md](../../../docs/migrations.md));
   - no real data anywhere: `vednemesicnik.test` for the newsroom, `external.test` for everybody
     outside it;
   - Conventional Commits — **the PR title included**, because a squash makes it the subject
     on `dev` ([docs/branching-model.md](../../../docs/branching-model.md)); issue and PR text in
     English.

8. **Present the plan for approval.** Call `ExitPlanMode` with the drafted plan. Do not
   write any file before this — plan mode blocks writes, so an earlier write would prompt
   to leave plan mode and skip the approval step (with its auto/manual edit choice).

9. **Save the plan file** once approved: write the same plan to
   `~/.claude/plans/plan-publikace-issue-<number>-<slug>.md`. The `publikace-` part is not
   decoration — `~/.claude/plans/` is shared with `cz.vednemesicnik`, whose issue numbers
   overlap with this repo's. That file and the issue's status are the only things this command
   writes — do not edit the repo or write anything else to GitHub.

   **Move the issue to _Todo_** once the plan is approved, so that it shows under _Active_:
   read its status with `gh api repos/{owner}/{repo}/issues/<number> --jq .status.name`, and
   only when that is _Backlog_ or empty, set it with
   `gh api -X PATCH repos/{owner}/{repo}/issues/<number> -f status=Todo --jq .status.name`.
   A plan redrawn for an issue already _In progress_ or _In review_ never moves it back.
   [docs/workflow-skills.md](../../../docs/workflow-skills.md) has which step sets which status.

10. **Close with what is open, in the order it should be done.** `/implement-issue <number>`,
    which picks up that plan file, is **one item on that list, not the list.** Planning almost
    always turns up something beside the plan — a premise of the issue that proved false, a
    question the plan had to route to `/ask-design`, an issue this one now blocks or unblocks.
    A report that names only the next command buries all of it.

    So end with a short numbered list, **most important first**, where the order is the
    argument: one or two lines per item saying what it is, what it waits on, and the command
    or act that starts it. Say plainly when the honest first item is not implementing. Then
    offer the top one as a question the user can answer in a word.

    Three or four items is a list; ten is a backlog, and the backlog is `gh issue list`.
