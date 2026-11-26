# Workflow skills

The skills in `.agents/skills/` carry an idea from the moment somebody says it out loud to
the moment its PR is merged and the context window is thrown away, for every application in the
repository. This file is how to use them. Each one's own `SKILL.md` is the authority on what it
does; this is the map above them. Where a skill needs something that differs between the
applications — the gates, the documents, the design canvas, the commit scopes, the rules — it
reads it from the `AGENTS.md` of the application the issue belongs to, § For the workflow skills.

## Two families

They divide by what each one takes in hand.

**Before an issue exists**, the subject is an idea and the argument is a sentence:

| Skill            | Takes                                 | Ends with                                                                                                  |
| ---------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/discover-idea` | an area — a screen, a flow, a surface | three to five evidenced candidates, and a recommendation of which to weigh first                           |
| `/review-idea`   | one proposal, in words                | a verdict: write the issue, ask design first, change the plan, or drop it — plus the argued text, unopened |

**Once there is an issue**, each one takes its number:

| Skill              | Takes             | Ends with                                                                      |
| ------------------ | ----------------- | ------------------------------------------------------------------------------ |
| `/plan-issue`      | issue number      | an approved plan in `~/.claude/plans/`, not a line of code                     |
| `/implement-issue` | issue number      | commits on a feature branch, typecheck and suite green, stopping before the PR |
| `/ship-issue`      | issue number      | a merged PR — after a question you answer                                      |
| `/next-issue`      | next issue number | a handoff, and a clean context window                                          |

Two stand outside both, called whenever something in the path is missing:

| Skill         | Takes                                   | Ends with                                                                       |
| ------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| `/ask-design` | the subject, or `check [code]` / `tidy` | a question uploaded to the design project, or an answer read back into the code |
| `/ask-copy`   | the subject, or `check` / `tidy`        | Czech UI text checked against the data model, questioned and answered in files  |

## Invoking them

Type `/name` and the argument — `/plan-issue 201`, `/discover-idea nahrání obrazových děl`. The
`argument-hint` in each skill's frontmatter is what autocomplete shows after the name.

Or say what you want and let the skill be found: every one of them carries a `description`
written to be matched, so _"naplánuj #201"_ reaches `/plan-issue` without the name being typed.
That is the reason these are skills rather than commands, and it is worth leaning on — the set is
large enough that remembering eight names is worse than describing the act.

## The issue's type and status

Every issue carries a type from the organisation: _Bug_ when the app does something other than
it should, _Feature_ when it does not yet do what the design draws, _Task_ for a deployment, a
job to set up or anything else that is work rather than behaviour.

Its status on GitHub follows the line of skills, and the _Active_ tab of the issue list shows
what is _Todo_, _In progress_ or _In review_:

| Status        | Set by                                                                             |
| ------------- | ---------------------------------------------------------------------------------- |
| _Backlog_     | GitHub, when the issue is opened                                                   |
| _Todo_        | `/plan-issue`, once the plan is approved                                           |
| _In progress_ | `/implement-issue`, once it is on the branch                                       |
| _In review_   | GitHub, when a PR with `Closes #<n>` opens; `/ship-issue` sets it for a stacked PR |
| _Done_        | GitHub, when the issue closes; `/next-issue` checks it                             |

A skill never moves an issue back: a plan redrawn for an issue in progress leaves it there. The
status is read and set through the REST API, `gh api repos/{owner}/{repo}/issues/<n>` and the
same path with `-X PATCH -f status=…`, because `gh issue` does not know it yet.

## Filing an issue

Whichever skill or session files an issue, it answers three questions first, in this order. The
agent answers them and files; it does not hand the user a list of follow-ups to tick, because it
holds the context and the user does not. It reports what it filed, what it added to an open issue
and what it left out, one line each.

**1. Does an open issue carry it already?** Read the open issues by their bodies, not only their
titles (`gh issue list --limit 100`, then `gh issue view` on the ones near it). Work the same PR
would touch anyway — the same screen, the same flow, the same files, the same blocker — goes into
that issue as a comment saying what it adds and why it belongs there. When it widens what the
issue is about, the title is rewritten to cover both, and a `can wait` issue that takes on
something the release needs loses the label. A new issue is for work no open one would carry.

**2. Is it the size of one PR?** An issue is one change a reviewer reads in one sitting and the
application can ship on its own: one behaviour on its surfaces, one job, one fix with its cause.

- **Too big** when it ships in parts that each work alone, or joins surfaces that do not need
  each other — a screen and a script in another repository, two unrelated flows. Split it; when
  the parts serve one aim, they are sub-issues of an epic.
- **Too small** when it needs no plan of its own: a string, a token, a few lines. It goes into
  the open issue nearest to it, or is made when a change next touches that file. Nothing is filed
  to sweep such things across the app.
- **A bug no open issue carries is filed however small it is.** The size rule folds work into
  other issues; it never drops it.

**3. Does the release need it?** Each application weighs this its own way, and its `AGENTS.md`
§ For the workflow skills says how — Publikace, until its `v1.0.0`, labels what the release
does not need `can wait`.

## Where each one stops, and why

The gates are the point of the sequence. A skill that ran past its gate would be deciding
something that is not its to decide.

- `/discover-idea` **weighs nothing.** The pass that invents an idea is the worst judge of it, so
  it hands the candidates over rather than acting on the best one.
- `/review-idea` **opens no issue.** It produces the argued text; you open it. Its most valuable
  outcome is a well-argued no, and a skill that could open issues would find fewer of them. The
  one thing it writes is the documents of the written design, under _Change the plan_, and it
  commits none of them.
- `/plan-issue` **writes no code**, and `/implement-issue` **opens no PR**.
- `/ship-issue` **asks before merging, then merges.** Green is not the same as wanted — a PR can be green and deliberately
  unmerged — so the merge is the answer to a question, not the end of a
  ramp. Answer it yes and the same run lands the PR.
- `/ship-issue` **retargets children before it lands anything.** The flag that is right for a
  feature branch closes an open PR when something is stacked on it, and a closed PR whose base is
  gone cannot be reopened. That check reads the live list of open PRs at the moment of the merge,
  which is why it lives in the run rather than in a command written out earlier. See
  [\_branching-model.md](_branching-model.md).

All four of the numbered stages **end on the same shape**: the report closes with what is still
open, as a short numbered list in the order it should be done, the stage's own next command being
one item on it rather than the whole of it. The gate above says what a skill may not decide; this
says what it may not leave unsaid. A stage that names only `/implement-issue` or `/next-issue`
hides whatever fell outside the pipeline — a design question waiting on an answer, a drawing the
change left stale, a follow-up worth its own PR — and those are precisely what a context window
ends without. Each of the four carries the rule tuned to what that stage actually leaves behind,
so the four are not copies of one another.

To land a PR an earlier session opened, run `/ship-issue` on its branch: it finds the existing PR
instead of opening one and carries on from the checks.

`gh pr merge` falls under the `Bash(gh pr *)` allow rule, so it does not raise a permission
prompt. The question inside `/ship-issue` is the only stop between a green PR and a landed one.

## The written design

Each application keeps a plan of what it does, what it stores and whom it lets in — its product,
architecture and security documents — and a design canvas for how each screen looks and reads;
its `AGENTS.md` § For the workflow skills names them. When the two disagree, the question decides
which one gives way: a question of UX is the canvas's, answered through `/ask-design`, and one of
product, architecture or security is the documents', decided by the agent running the skill,
because the design answers UX only. The agent holds the documents, the code and the evidence, so
it states those decisions with their reasons rather than asking; you are asked only where the call
turns on something only you know, and then with its recommendation first.

The documents change whenever what they say stops being true, and every skill reads them for that:

| When the plan changes…                                                               | the documents change in                                                                                        |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| with code — an issue adds a state, a rule, a job, a door                             | the issue's own PR: `/plan-issue` names the sections, `/implement-issue` edits them, `/ship-issue` checks them |
| without code — a decision, a service that changed, a rule the newsroom does not keep | a `docs/…` branch from `/review-idea`'s _Change the plan_, committed when you say so                           |
| unnoticed — a merge that left them behind                                            | a follow-up `/next-issue` offers                                                                               |

`/discover-idea` reports a document that has fallen behind as a candidate and edits nothing,
because whether the document or the code is the one that is wrong is a judgement. The documents
say what is true now, never what it used to be: git keeps the history. What the work settles that
the documents do not say goes into the repository's [work log](work-log/README.md) (`/log-work`).

## Where they live, and the links that get them there

The workflow skills are tracked in the root **`.agents/skills/`**, one copy for every
application, beside `log-work`, `release-pr`, `review-implementation` and
`modern-web-guidance`. Each application's own skills — the guidance for its stack and its house
style — are tracked in **`apps/<app>/.agents/skills/`**: the web's `react-router`, `prisma-*`,
`general-guidance` and `component-authoring`; Publikace's `remix`, which is not tracked but copied
from the installed `@remix-run/cli` template, since the published package is its only source.

Claude Code looks in **`.claude/skills/`**, and `.claude/` is ignored apart from `agents/`.
`pnpm claude:skills:link`, run from the root, joins the two: one symlink per skill,
`.claude/skills/<name> → ../../.agents/skills/<name>`, at the root and in each application. It
is run once per clone, after `pnpm install`, and again after adding or renaming a skill. For each
skill it writes a missing link, removes a link whose skill is gone, and leaves a **real
directory** of that name alone, naming it in the output — so an experiment of your own can sit
in `.claude/skills/` uncommitted.

A session started at the root sees the root's skills at once and an application's once it reads
or edits a file in that folder; a session started inside an application sees both. An
application's `CLAUDE.md` (two lines importing its `AGENTS.md`) loads the same way. Subagents are
read from the root's `.claude/agents/` only, so `ux-designer` and `implementation-reviewer` take
the application from their brief.

## Editing a skill

A skill is a directory with a `SKILL.md` in it. The frontmatter fields used here:

| Field           | What it does                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `name`          | the `/name` it answers to; must match the directory                                                      |
| `description`   | what Claude reads to decide whether to offer the skill — the trigger, not decoration                     |
| `argument-hint` | the placeholder autocomplete shows after the name                                                        |
| `allowed-tools` | tools pre-approved for the turn that invokes the skill, so a read-only sweep does not prompt eight times |

Two more exist and are not used here. `disable-model-invocation: true` keeps a skill out of
Claude's reach entirely, including from other skills: a skill carrying it cannot be reached by the
Skill tool at all, only by you typing its name. `user-invocable: false` does the reverse.

Claude Code picks up edits during a session, without a restart, and follows the symlink to do it
— editing `.agents/skills/<name>/SKILL.md` is enough. A **new** skill is seen only once it has a
link, so `pnpm claude:skills:link` is the step that publishes it. Creating the top-level
`.claude/skills/` when it did not exist at startup is the one case that needs a new session
before it is watched.

To check what a session actually sees, ask one that has just started:

```sh
claude -p "List ONLY the names of the skills from this repo's .claude/skills, comma separated." \
  --model claude-haiku-4-5-20251001
```

It lists a linked skill exactly as it lists a real one, which is what makes it a check on the
links as much as on the frontmatter.

## What does not live here

The rules — `.agents/rules/` at the root for the whole repository, `apps/<app>/.agents/rules/`
for one application — are the mandatory conventions. They are not skills: each `AGENTS.md`
names its rules and the moment each applies, and a rule is read by its path before acting
rather than invoked. A rule binds the folder it sits in.

Each application's copy context document is consulted by **somebody outside this repository** —
the copywriter in the shared room reads it whole at the start of every `/ask-copy` thread. It
lives in the application's `docs/` rather than beside the skill because it describes what the
application does, kept true by whoever changes it.
