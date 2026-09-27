---
name: ask-copy
description: Take the app's user-facing Czech through a copywriter — collect the strings with the context they need, open the question as a thread in the shared room, hand over the join prompt, and read the answer back from that thread, checked against the data model. Use when a screen's wording is in doubt, when new Czech UI text has to be written, when the copywriter's answer has come back and needs reading in, or when the drafts of settled threads need clearing out.
argument-hint: <screen, file or string — empty for this branch; "check" when the answer is back; "tidy" to retire the drafts of settled threads>
---

Put the app's Czech in front of somebody whose job is words, and bring back wording that is
plainer than what an engineer writes without stopping being true.

**This runs for every user-facing string, not only for a contested one.** A string nobody argued
about was still written while solving something else, by somebody thinking about the mechanism
rather than about the reader.

$ARGUMENTS names what to take: a screen, a file, one string, or — with no argument — every
user-facing string this branch adds or changes. `check` means the answer is back: skip to step 6.
`tidy` means no question at all — skip to step 8.

## The shape of this loop

The copywriter is a chat **in the shared room** (`vdm-dev-exchange` in `.mcp.json`; the server is
`../vdm-dev-exchange-mcp`, the room `../dev-exchange-room`), and a question travels as a
**thread**: `ask_open` with `kind: "copy"` starts it, `ask_reply` carries every turn, `ask_read`
reads it back. The server must be running and `VDM_EXCHANGE_CLAUDE_TOKEN` set; without the
`ask_*` tools this loop cannot run — say so and stop.

**The copywriter has `ask_*` and nothing else. It cannot read any file** — not in this repository,
not in the room. A prompt that names a file buys a round trip in which it asks for the content.

**So the context rides in the thread.** [docs/_copy-context.md](../../../docs/_copy-context.md) is
the durable half of the loop — terms, content states, roles, voice, the claims that are not true,
and the answer shape — and its **whole content goes into the opening turn**, above the question,
in every thread. The copy in a thread is a snapshot: a later fix to the file reaches an open
thread only as a turn.

**`tmp/copy/` is the drafting half** (gitignored): one `<YYYY-MM-DD>-<slug>.md` per question and
the join prompt `tmp/copy/join-room.md`. No `-answer.md` — the record is the thread, and then the
string in the code and in the drawing.

### Holding the watch is this side's job

**The tool call after `ask_reply` is `ask_wait` on that thread. Not the one after that.** An index
to upload, a commit, a report — all of it goes after the wait returns. A turn that asks something
back owes a watch; only `closed` ends it.

**The close is this side's too.** A turn that confirms and leaves nothing to ask back is answered
by `ask_close` as the very next call, with a resolution naming where the wording goes — this
branch's PR, or the `/ask-design` question that now carries it.

**Read the folder before writing.** `ask_reply` reports turns that landed while you composed one
turn too late. `ls ../dev-exchange-room/.ask/copy/<thread>/` says whose the last file is; `cat`
the turns you have not seen instead of `ask_read`-ing the whole thread again.

## 1. Collect the strings

With no argument, the net is the branch:

```sh
git diff dev...HEAD -- app ':!*.test.*' ':!*.stories.*' | grep '^+' | grep -v '^+++' \
  | grep '[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]' | grep -vE '^\+\s*(\*|//|/\*)'
```

It is a net, not an answer: it catches comments and fixtures and misses Czech without a diacritic
(_Uložit_, _Zpět_). Open the files it points at and take the strings around them — a label is
judged against its neighbours. Validation messages live in `_schema.ts` files.

## 2. Give each string what a copywriter cannot guess

`docs/_copy-context.md` carries what is true of every string — **do not repeat it**. The prompt
owes what is true of _these_ strings:

- **Where it sits** — which control, what is above and below, label or note or button.
- **Which surface** — veřejný web, administrace, or e‑mail a formulář.
- **What it competes with for length.**
- **When it appears** — always, or only after a failure, or only for one state or role.
- **Terms at stake** the context file does not list.
- **What the app already says for the same thing elsewhere.** Grep it; consistency beats novelty.

## 3. State what makes _this_ wording false

The failures worth preventing are fluent sentences that claim something the app does not do.
Write the facts this string has to survive — what the app knows here, what it does not, what
happens next — **from the code, not from the string being replaced**. Permissions, content states
and who approves are where this app's wording goes wrong.

**No real data leaves this repository.** Fictional names, `priklad.cz`, nothing from the database
or `.env`.

## 4. Ask for the right shape of answer

The shape is in the context file. Say it again only when this question needs something else: a
character budget, one candidate, a wording that must match a sibling string.

## 5. Hand it over

**Open the thread, context first.** Draft the question in `tmp/copy/<YYYY-MM-DD>-<slug>.md`
(create the folder), then `ask_open` with `kind: "copy"`, a short topic, and a body that is **the
whole of `docs/_copy-context.md`, then the question**. The body must stand alone.

**Then the join prompt.** Copy [join-room-template.md](join-room-template.md) to
`tmp/copy/join-room.md` if it is not there, and set its first line to the new thread's code and
topic. Add a per-thread note when the question is not the ordinary case — a string a design
drawing carries needs an **argument**, not just a better sentence; a claim about the code you
inferred rather than read is **marked as yours to disagree with**.

Put it on the clipboard. This shell has no locale, so force UTF-8 on **both** ends — a bare
`pbpaste` shows mojibake for a clipboard that is fine:

```sh
LC_ALL=cs_CZ.UTF-8 pbcopy < tmp/copy/join-room.md
LC_ALL=cs_CZ.UTF-8 pbpaste | grep <thread-id>
```

Then report what went out and **call `ask_wait` on the thread**.

## 6. `check` — what comes back is a proposal, not a decision

`ask_list` with `kind: "copy"` and `state: "mine"`, then read the thread including your own
opening turn. Before anything reaches a source file:

1. **Check every claim against the code**, not against how good it sounds. Grep every noun that
   names a thing.
2. **Check the terms survived** against `docs/_copy-context.md`. A term the answer challenged
   **by name** is a question back — answer it rather than overrule it.
3. **Check it still fits** — length, neighbours, the state it appears in.
4. **Fix what the context file got wrong** in `docs/_copy-context.md` in the same branch.
5. **Say which candidate you would take and why**, then take it.

When something is missing, `ask_reply` on the same thread rather than a guess. Once the choice is
made and said, `ask_close` — before the string lands in a source file.

## 7. Land it, and route what is not ours

- **A string drawn in a design document is design's** — the legend makes unmarked text a
  constant. Carry the new wording to `/ask-design` with the reasoning, so the drawing and the code
  change together.
- **A string no drawing carries** — most validation sentences and notes — is ours. Change it and
  say in the PR that it went through this loop.

## 8. `tidy` — retire what is settled

What `tidy` retires is the drafts in `tmp/copy/`. A thread still open here is a finding — close it
and say so. A draft is retirable only when its thread is `closed` **and** the settled wording is
in the app:

```sh
grep -rn "<the accepted wording>" app --include='*.ts' --include='*.tsx' | grep -v test
```

No hit, no retirement — unless step 7 routed it to `/ask-design`; then name that question.
Reset the join prompt's thread line when its thread closes. Report what was retired and what
stayed, with the reason for each.
