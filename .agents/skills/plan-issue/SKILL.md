---
name: plan-issue
description: Fetch a GitHub issue and produce a repo-aware implementation plan (plan mode). Use when an issue is about to be worked on and needs a plan before any code is written.
argument-hint: <issue-number>
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*)
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

You are the **planning stage** of the issue pipeline:
`/discover-idea` → `/review-idea` → **`/plan-issue`** → `/implement-issue` → `/ship-issue` → `/next-issue`.

1. **Handle a missing argument.** If "Requested issue number" is empty, the issue block has
   errored — do not plan. Show the "Open issues" list and ask which one to plan
   (`/plan-issue <number>`). Otherwise ignore the fallback list.

2. **Check it was weighed before you plan how.** Not every issue came through `/review-idea`,
   and two questions are the ones a plan cannot recover from:
   - **Does anything produce the data the issue consumes, and does that thing exist?**
   - **If the record is missing, does its absence mean anything?**

   A "not designed yet — do not invent it here" note that names the _producer_ is a blocker
   wearing the clothes of a scope note. If either question comes out badly, **stop and say so
   before planning** and offer `/review-idea` instead.

3. **Enter plan mode.** If the session is not already in plan mode, call `EnterPlanMode`
   before anything else.

4. **Explore — and read it yourself unless you cannot.** Read `AGENTS.md` first, then the
   `.agents/rules/*/RULE.md` for the file types the change touches and the relevant
   `.agents/skills/*/SKILL.md` (react-router for routes/loaders/actions/middleware, prisma-*
   for schema work, general-guidance for `.css` and `.stories.tsx`), and the
   `modern-web-guidance` search for HTML/CSS/client-side JS. Prefer reusing existing
   functions and components over proposing new code.

   **Subagents are the exception, not the method.** Most issues name the function and the
   file, and a `grep` plus a `sed -n` answers them for a fraction of what an agent costs.
   Spawn one only when the scope is genuinely unknown or the answer needs sweeping many files
   and naming conventions — and say which. Its brief is **one target and one question**, plus
   the shape of the answer.

5. **Read the design, not the issue's paraphrase of it.** When the issue touches a screen,
   open the design project (`DesignSync`, app project `60d13daa-be98-47ec-95e1-e8913a86fef4`,
   components in the design system `4b484003-4984-46c4-86cc-a96eee9e4b4a`). `get_file` a
   document **in this session** and cut one screen out of it with
   `pnpm design:screen <saved file> 22a` — see
   [docs/\_design-project.md](../../../docs/_design-project.md). Where the design is silent or
   two screens disagree, say so in the plan and point at `/ask-design` rather than inventing
   the answer.

6. **Draft the plan** with these sections:
   - **In short** — what the approval is actually read from, so it comes first and stays
     short: what changes from what to what, why now, and a handful of bullets pointing at
     what deserves a second look (a false premise in the issue, a decision that contradicts
     existing code, scope past the issue's examples, a migration). Each bullet names the
     section that carries the detail. **Added, never traded for.**
   - **Context** — issue URL and a short summary of the problem and intended outcome.
   - **Acceptance criteria** — the issue's checkboxes, or an explicit list when it is prose.
     Quote a design decision rather than paraphrase it.
   - **Scope** — what changes, what stays out.
   - **Implementation steps** — concrete files, referencing existing utilities to reuse.
   - **Verification** — `pnpm app:typecheck` and `pnpm test`, plus how to see it in the app
     when the change is user-visible.

7. **Respect the repo's conventions** in the plan:
   - branch `feat/<issue-number>-<kebab-slug>` (`fix/…` for bugfixes) off `dev`;
   - kebab-case files, `type` over `interface`, no abbreviations, functional style, TSDoc on
     exported functions (`.agents/rules/`);
   - `.module.css` rules wrapped in `@layer`;
   - Czech for anything a user reads, English for code, comments and commits;
   - `prisma migrate dev`/`reset` is consent-guarded for agents — plan it as a step the user
     confirms;
   - Conventional Commits — **the PR title included**: a multi-commit squash puts the PR
     title on `dev`; issue and PR text in English.

8. **Present the plan for approval** with `ExitPlanMode`. Write no file before this — plan
   mode blocks writes, and an earlier write skips the approval step.

9. **Save the plan file** once approved: `~/.claude/plans/plan-issue-<number>-<slug>.md`. It
   is the only thing this skill writes — no repo edits, nothing on GitHub. (Billing uses
   `plan-billing-issue-*` in the same directory; the prefixes keep the overlapping issue
   numbers apart.)

10. **Close with what is open, in the order it should be done.** `/implement-issue <number>`
    is **one item on that list, not the list.** Planning turns up things beside the plan — a
    false premise, a question routed to `/ask-design`, an issue this one blocks. End with a
    short numbered list, most important first, one or two lines each (what, what it waits on,
    the command that starts it). Say plainly when the honest first item is not implementing.
    Offer the top one as a question answerable in a word. Three or four items is a list; ten
    is a backlog.
