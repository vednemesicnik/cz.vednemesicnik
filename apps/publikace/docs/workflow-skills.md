# Workflow skills

The eight skills in `.agents/skills/` carry an idea from the moment somebody says it out loud to
the moment its PR is merged and the context window is thrown away. This file is how to use them.
Each one's own `SKILL.md` is the authority on what it does; this is the map above them.

## Two families

They divide by what each one takes in hand.

**Before an issue exists**, the subject is an idea and the argument is a sentence:

| Skill            | Takes                                 | Ends with                                                                                 |
| ---------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/discover-idea` | an area — a screen, a flow, a surface | three to five evidenced candidates, and a recommendation of which to weigh first          |
| `/review-idea`   | one proposal, in words                | a verdict: write the issue, ask design first, or drop it — plus the argued text, unopened |

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

## Where each one stops, and why

The gates are the point of the sequence. A skill that ran past its gate would be deciding
something that is not its to decide.

- `/discover-idea` **weighs nothing.** The pass that invents an idea is the worst judge of it, so
  it hands the candidates over rather than acting on the best one.
- `/review-idea` **opens no issue.** It produces the argued text; you open it. Its most valuable
  outcome is a well-argued no, and a skill that could open issues would find fewer of them.
- `/plan-issue` **writes no code**, and `/implement-issue` **opens no PR**.
- `/ship-issue` **asks before merging, then merges.** Green is not the same as wanted — `#130` is
  green and deliberately unmerged — so the merge is the answer to a question, not the end of a
  ramp. Answer it yes and the same run lands the PR.
- `/ship-issue` **retargets children before it lands anything.** The flag that is right for a
  feature branch closes an open PR when something is stacked on it, and a closed PR whose base is
  gone cannot be reopened. That check reads the live list of open PRs at the moment of the merge,
  which is why it lives in the run rather than in a command written out earlier. See
  [branching-model.md](branching-model.md).

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

## Where they live, and the links that get them there

The eight are tracked in **`.agents/skills/`**, beside the rules — and beside two more that are
not tracked, because they are somebody else's; see the end of this file.
Claude Code looks in **`.claude/skills/`** and nowhere else, and `.claude/` is ignored in full —
`settings.local.json` and `launch.json` are per-developer, and a directory that is half tracked
and half not is a directory somebody eventually commits their own settings into.

`pnpm dev:setup-claude` is what joins the two: one symlink per skill,
`.claude/skills/<name> → ../../.agents/skills/<name>`. It is run once per clone, and again after
adding or renaming a skill. It stays out of `postinstall` on purpose — not everybody here works
with Claude, and an install step is for what everybody needs.

[../scripts/setup-claude.ts](../scripts/setup-claude.ts) is short, and for each skill it does
one of three things:

| It finds                                              | It does                                       |
| ----------------------------------------------------- | --------------------------------------------- |
| a skill with no link, or a link pointing elsewhere    | writes the link                               |
| a link into `.agents/skills/` with nothing at the end | removes it — the skill was renamed or dropped |
| a **real directory** of that name                     | leaves it alone and names it in the output    |

The last row is why these are one link per skill rather than one link over the whole directory:
`.claude/skills/` stays a real directory, so an experiment of your own can sit in it uncommitted.
It shadows the repository's skill of the same name, and the script says so rather than quietly
losing one of the two.

The same run writes **`CLAUDE.md`**, two lines importing [../AGENTS.md](../AGENTS.md), and
leaves it alone if you have written one yourself. That file is gitignored for the reason the
skills are: `AGENTS.md` is the guide, under the name every agent looks for, and a second copy
under one vendor's name would be a second thing to keep true.

**The guidance that is somebody else's is linked on the same terms.** `.agents/skills/remix/`
and `.agents/skills/modern-web-guidance/` answer to `/remix` and `/modern-web-guidance`, and
Claude reaches them on their `description` alone. They are documents to consult rather than
sequences to run, so nothing in them has a gate; the link is what makes finding them independent
of somebody remembering a path.

**Neither of the two is in git, and both arrive with `pnpm dev:setup-claude`.**

`.agents/skills/remix/` is the scaffolder's: `remix new` writes it into every new app, and
`@remix-run/cli` ships the same files in its `template/`, so the setup script copies it from
`node_modules` on every run. Which revision a checkout gets is already pinned — by the lockfile
that pins the CLI — and the published package is the only source there is. The skill is not in
`remix-run/remix`: `packages/cli` holds no `template/`, and the `.agents/` at that repository's
root is Remix's own contributor tooling (`fix-issue`, `make-pr`) plus a different, 5 kB `remix`
skill with no `references/`. So there is no newer revision upstream for the template to fall
behind.

It was a **fork** until 18 September 2026, and the fork had gone stale in the way a fork does:
it still told an agent to keep `app/actions/render.tsx` small, a file this app no longer has,
while the scaffold had moved to the `render()` middleware
[../app/router.ts](../app/router.ts) actually installs. Of the 281 lines that differed, most had
since been absorbed upstream. What was genuinely ours — that the runtime reads `data-rmx-*` and
silently ignores the bare `rmx-` spelling — moved into _Things that will bite you_ in
[../AGENTS.md](../AGENTS.md), which nothing overwrites. **That is where a Remix lesson goes now**;
anything written into the skill directory is gone on the next `pnpm dev:setup-claude`.

`modern-web-guidance` is untracked for a different reason: nothing in it is ours to begin with.
It is 145 files copied from
[GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance), which
would have been a quarter of this repository's tracked files and, once it is public, a
republication of somebody else's Apache-2.0 corpus. So the directory is gitignored and
[../skills-lock.json](../skills-lock.json) is what is tracked — source and hash — with
`pnpm dev:setup-claude` turning the one into the other. Nothing is lost by it: `search` and
`retrieve` run `modern-web-guidance@latest` over the network, so the files on disk are a
browsable mirror of the answer rather than its source.

They are also the two directories [../.oxfmtrc.json](../.oxfmtrc.json) keeps out of `oxfmt`: both
are copies of somebody else's files, and re-formatting them makes the next diff against upstream
unreadable. Everything else under `.agents/` is ours and is formatted, so `pnpm format` after
editing a skill is the same habit as after editing any other Markdown.

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
link, so `pnpm dev:setup-claude` is the step that publishes it. Creating the top-level
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

`.agents/rules/` holds the mandatory conventions — comments, component files, component API, test
mocks, layout. They are not skills: `AGENTS.md` names each one and the moment it applies, and a
rule is read by its path before acting rather than invoked.

There is a third case, and `/ask-copy` is the one that has it. `docs/copy-context.md` is
consulted by **somebody outside this repository** — it is uploaded to the copy chat as a source
file, where it is read-only, and it holds the terms, the voice and the claims that are not true. It lives in `docs/` rather than beside the skill because it is a description of what the
app does, kept true by whoever changes the app, and only incidentally the thing that keeps the
prompts short.
