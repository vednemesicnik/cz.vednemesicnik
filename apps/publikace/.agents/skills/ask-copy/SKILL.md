---
name: ask-copy
description: Take the app's user-facing Czech through a copywriter — collect the strings with the context they need, open the question as a thread in the shared room, hand over the join prompt, and read the answer back from that thread, checked against the data model. Use when a screen's wording is in doubt, when new Czech UI text has to be written, when the copywriter's answer has come back and needs reading in, or when the drafts of settled threads need clearing out.
argument-hint: <screen, file or string — empty for this branch; "check" when the answer is back; "tidy" to retire the drafts of settled threads>
---

Put the app's Czech in front of somebody whose job is words, and bring back wording that is
plainer than what an engineer writes without stopping being true.

**This runs for every user-facing string, not only for a contested one.** A string nobody
argued about is the usual case and still the one worth improving: it was written while
solving something else, by somebody thinking about the mechanism rather than about the person
reading it. New strings and edited strings both qualify.

$ARGUMENTS names what to take: a screen, a file, one string, or — with no argument — every
user-facing string this branch adds or changes. `check` (or `--check`) means the answer is
back: skip to step 6. `tidy` means no question at all — skip to step 8.

## The shape of this loop, and the one thing it does not share with `/ask-design`

The copywriter is a chat **in the shared room**, and a question travels as a **thread**:
`ask_open` with `kind: "copy"` starts it, `ask_reply` carries every turn either way, `ask_read`
reads it back. Nothing is relayed by hand and no file changes hands.

### The copywriter has `ask_*` and nothing else

**It cannot read a file. Any file.** `ask_open`, `ask_list`, `ask_read`, `ask_reply`, `ask_wait`,
`ask_close` — that is the whole of its reach, and none of them takes a path. So **no path works**:
not one in this repository, not one in the room, not an absolute one. A prompt that names a file
buys a round trip in which the copywriter correctly refuses to work and asks for the content.

That is the operative fact. Behind it stands the reason not to reach for a repository path even
if a participant one day _could_ read one:

> **The room is the grant.** It is `../dev-exchange-room`, outside this repository on purpose —
> a participant told only the room path cannot wander a codebase it was never shown. Nothing in
> here, `tmp/` included, is theirs to be pointed at; gitignored is not outside.

**So the context rides in the thread.** `docs/copy-context.md` is the durable half of the loop —
the terms, the voice, the catalogue of claims that are not true, and the answer shape — and its
**whole content goes into the opening turn**, above the question, in every thread. It is verbose
and it is right: the alternative is a reference the other side cannot follow.

One consequence worth saying out loud: the copy in the thread is a **snapshot**. `docs/copy-context.md`
is the source, and a thread opened last week carries what the file said last week. That is fine —
threads are short-lived — but it means a correction to the file is not retroactive, and if it
matters to a thread already open, it goes in as a turn.

### What `tmp/copy/` is now

The **drafting** half, and nothing more: composing four thousand characters straight into a tool
call is how a question loses its structure. One `<YYYY-MM-DD>-<slug>.md` per question, plus the
standing join prompt. Gitignored, because it holds no truth — the record is the thread, and then
where the string ends up, in the code and in the drawing. **No `-answer.md`**: an answer that
also lives in a file is a second archive that will one day disagree with the thread.

### Holding the watch is this side's job

**After every turn you write, call `ask_wait` on that thread and stay on it.** The whole point of
the room is that nobody has to be poked: a question that sits unanswered because this side walked
away is worse than no room at all, because it looks like progress. Coming back empty is the hold
running out and not an error — call it again. Only `closed` ends the watch.

That includes the turns that are not answers. When the copywriter asks something back, it is
waiting on **us**, and the reply is owed at once — the loop is a conversation, and half of it
being asynchronous is not a reason for the other half to be absent.

**The tool call after `ask_reply` is `ask_wait` on that thread. Not the one after that.** It is
written as a sequence rather than as an intention because the intention was already here on
12 Sep 2026, in gentler words — _„in one breath"_ — and it failed twice the same afternoon. Both
times the reply went out and the watch did not; both times somebody in the chat had to notice.

What displaces it is never a decision to skip it. It is the **housekeeping queued behind the
reply**: an index to upload, a commit to make, a report to write. Each of those produces
something to show and the watch produces silence, so the watch loses whenever the response is
composed around what got done. That is backwards — it is the only one of the four with another
party waiting at the other end. **All of it goes after the wait returns.**

The second trap is a turn that _feels_ final. Once because the strings were landed, once because
the answer had already been carried onward. Neither was: both ended in a question, and a turn
that asks something is by definition one that owes a watch.

**The close is this side's too, and it follows the settled answer, not the landed string.** The
copywriter holds `ask_wait` on the thread for as long as it is open, so a thread kept open while
the string is implemented, reviewed, merged or carried to design is a participant parked on a
question nobody will touch again. **A turn that confirms, and leaves nothing to ask back, is
answered by `ask_close` as the very next tool call** — not by `ask_wait`, not by a file edit, and
not by a turn promising when. The resolution names where the wording is going, even before it is
there: the PR it will land in, or the design question that now carries it. If the wording is
needed again later, that is a new thread.

This paragraph is here, and in step 6, because the rule used to live only outside the skill while
the skill itself closed threads at `tidy`, once the string was in the app. Five threads between
12 and 17 Sep 2026 were left open that way, each one noticed by Libor rather than by the loop.

**And read the folder before writing, not after.** `ask_reply` answers with any turns that landed
while you were composing — which means the room tells you about them **one turn too late**, and
that turn is already written against a thread that moved. One `ls` of
`../dev-exchange-room/.ask/<kind>/<thread>/` costs nothing and says whose the last file is: if it
is not yours, read it before you compose. Twice on 12 Sep a reply went out over a turn that was
already there, and one of them carried a claim the unread turn had just corrected.

**Read the new turn, not the whole thread.** `ask_read` returns every turn, and this thread's
opening one carries the whole context file — so on a long exchange it is the same eight thousand
tokens again for two hundred new ones. This side has what the copywriter does not, a filesystem:
the turns are separate files under
`../dev-exchange-room/.ask/<kind>/<thread>/`, numbered `01-claude.md`, `02-copy.md` and so on.
`cat` the ones you have not seen. `ask_read` is for arriving at a thread cold, `ask_list` for
knowing whose move it is.

### Against `/ask-design`

There the question is uploaded into the design artifact, an agent answers it there, and the
answer is read back out of it — nobody carries anything. Here the **room** is the medium in both directions, and the
one thing that still travels by hand is the **join prompt** — the single paste that puts the chat
in the room and names the thread waiting for it.

## 1. Collect the strings

With no argument, the net is the branch:

```sh
git diff dev...HEAD -- app ':!*.test.*' | grep '^+' | grep -v '^+++' \
  | grep '[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]' | grep -vE '^\+\s*(\*|//|/\*)'
```

**It is a net, not an answer.** It still catches JSX block comments, fixture names and test
expectations, and it misses any Czech string without a diacritic (_Uložit_, _Zpět_, _Storno_,
_Odeslat_). Read what it returns, throw out what no user reads, then open the files it points
at and take the strings around them too — a label is judged against its neighbours, never
alone.

For a screen or a file, read it and take every string a person sees: labels, placeholders,
buttons, notes under fields, error sentences, empty states, confirmations, toasts, and the
Czech inside `app/domain/` that reaches a screen (validation messages live there).

## 2. Give each string what a copywriter cannot guess

`docs/copy-context.md` already carries what is true of every string — the terms, the voice, the
three surfaces. **Do not repeat it in the prompt.** What the prompt owes is what is true of
_these_ strings only:

- **Where it sits.** Which control it belongs to, what is directly above and below it, whether
  it is a label, a note, a button or a sentence in a summary. A note under a `<select>` is
  read together with the options in that `<select>` — quote them.
- **Which of the three surfaces it is on** — screen, document, message. The context file says
  why that changes the answer; the prompt says which one this is.
- **What it is competing with for length.** A label in a column of fields, a sentence that
  must not wrap to three lines, a button that sits beside another button.
- **When it appears.** Always, or only after something failed, or only for one kind of record.
  A sentence that shows up in one state is written differently from one that is always there.
- **Any term at stake that the context file does not already list.** The general list reaches
  the copywriter through the room; a term local to this screen does not.
- **What the app already says for the same thing elsewhere.** Grep it. Consistency beats
  novelty: the detail already says _„v detailu vydání"_, so a new string about the same place
  says that too rather than inventing _„na stránce vydání"_.

## 3. State what makes _this_ wording false

The failures worth preventing are not clumsy sentences — they are fluent sentences that claim
something the app does not do. `docs/copy-context.md` carries the three real ones and the two
rules they come from (what is issued is frozen; paid is not a status). The prompt adds the
facts **this** string has to survive: what the app knows here, what it does not, and what
happens next.

Write those from the code, not from the string being replaced — the string may already be
wrong, which is often why it is being looked at.

**No real data leaves this repository.** Fictional names, `priklad.cz`, no rows from `db/`,
nothing from `.env`. The repository is going public and this is the same rule.

## 4. Ask for the right shape of answer

The shape is in the context file — two or three candidates, terms challenged by name, plain
impersonal Czech, shorter beats longer but never at the price of a claim that is not true. The
prompt only says it again when this question wants something the file does not cover: a fixed
character budget, one candidate rather than three, a wording that has to match a sibling string.

## 5. Hand it over

Three moves, in this order. Do not skip the first because the last one is the visible one.

**Open the thread, context first.** `ask_open` with `kind: "copy"`, a short topic, and a body
that is **the whole of `docs/copy-context.md`, then the question**. Draft the question in
`tmp/copy/<YYYY-MM-DD>-<slug>.md` first — creating the folder if it is not there — then send the
two together. **The body must stand alone in the strongest sense**: the copywriter has no way to
read anything you do not put in it, so a body that names a file comes back as a request for that
file. The draft stays behind as a draft, and its tail says the answer comes through the thread,
so the two never disagree.

**Then the join prompt**, which is the only thing that reaches the chat by hand.
`tmp/copy/chatgpt-join-room.md` is the standing template — **read it and update it, never
reconstruct it from memory**, because what rots in it is the one thing nobody re-reads: the
thread it names. It carries, in this order:

1. who the chat is in the room — the participant `copy`, and that the token it joins with is its
   identity;
2. that the terms, the voice and the answer shape are **in the thread's opening turn** and
   nowhere else — no path, because there is no path it could open. This is the line that was
   wrong twice: first a repository path, then a room path, and both cost a round trip;
3. the loop — `ask_list` with `state: "mine"`, `ask_read`, `ask_reply`, and `ask_wait` after
   **every** turn — and that it never calls `ask_close` itself, because this side closes the
   thread as soon as the wording is settled, and a closed thread is its signal to stop;
4. **the name of the waiting thread.** A stale name sends the chat to an empty `ask_list`, where
   it has nothing to work on and no way to tell that from having nothing to do.

Add a per-thread note where this question is not the ordinary case, because it changes what a
useful answer is: a string that a drawing carries needs an **argument** and not just a better
sentence, since design will weigh it; and a claim about the code that you inferred rather than
read should be marked as **yours to disagree with**, so a milder reading comes back as an answer
instead of being conceded.

Then put it on the clipboard, because that paste is the whole hand-over and `pbcopy` is silent
when it fails.

**This shell has no locale set at all** (`LC_CTYPE` and `LANG` are both empty), so Czech has to be
forced through UTF-8 on **both** ends — and the second one is the trap:

```sh
LC_ALL=cs_CZ.UTF-8 pbcopy < tmp/copy/chatgpt-join-room.md
LC_ALL=cs_CZ.UTF-8 pbpaste | head -5
```

Check the thread name survived into the clipboard too, not just the diacritics —
`LC_ALL=cs_CZ.UTF-8 pbpaste | grep <thread-id>` — because the one thing that goes stale in that
template is the one thing a spot-check of the first five lines cannot see.

A bare `pbpaste` prints `p≈ô√≠li≈°` for a clipboard that is perfectly fine. Check with the bare
one and you will "fix" a hand-over that was never broken — and, worse, trust a bare `pbcopy`,
which really does store the mojibake it shows.

Then report what went out — and **do not stop watching**. Call `ask_wait` on the thread and hold
it. The copy chat is a separate conversation, but the thread is this side's to answer: it may
come back with a question rather than an answer, and that is owed a reply here and now.

The only thing this loop hands to a person is the paste itself. Everything after it is ours.

## 6. `check` — what comes back is a proposal, not a decision

Find the answer first. `ask_list` with `kind: "copy"` and `state: "mine"` — those are the threads
where the copywriter has spoken and the move is back on us. Then `ask_read` on the one you asked,
**the whole thread including your own opening turn**, because what the answer is answering is half
of whether it is a good answer.

**Read the thread, not a summary of it.** `/ask-design` learned this the hard way: the first time
it ran, the relayed version and the real one differed on three things and every one of them was a
line of code.

Then, before anything reaches a source file:

1. **Check every claim against the code**, not against how good it sounds. Every noun that
   names a thing gets grepped: if the wording says _článek bez autora_, find out what the
   app calls that and whether the two are the same set. This is where the three failures in the
   context file would have been caught, and each of them read perfectly well.
2. **Check the terms survived.** Diff the nouns against `docs/copy-context.md` and against step
   2's local list. A renamed term is a finding, not a detail — it is how one screen starts
   calling a thing something the next screen does not. A term the answer challenged **by name**
   is not a finding; it is a question back, and it gets answered rather than overruled.
3. **Check it still fits** where it has to sit: length, the neighbours, the state it appears in.
4. **Feed back what the context file got wrong.** If the answer went astray because the context
   was silent or stale on something, that is the durable half of this loop failing — fix
   `docs/copy-context.md` in the same branch. Every thread opens with the file's whole content,
   so the fix reaches the next thread by itself — and a thread already open gets it as a turn.
5. **Say which candidate you would take and why**, then take it.

When something is missing, the answer to that is `ask_reply` on the same thread rather than a
guess — the loop is a conversation and asking back costs one turn.

**Then close the thread, before anything reaches a source file.** Once the choice is made and
said in the thread, and the copywriter has nothing left to answer, `ask_close` with the
resolution naming where the wording goes next — this branch's PR, or the `/ask-design` question
step 7 routes it to. A confirming turn from the copywriter after that choice is the same moment:
the next call is `ask_close`. Landing the string, running the suite and opening the PR all come
after, and none of them needs the thread open.

## 7. Land it, and route what is not ours

A string a user reads is drawn in the design documents, where the legenda makes it a constant —
_text without a marker is a řetězec aplikace, tiskne se přesně takhle_. So:

- **A string that appears in a drawing is design's.** Changing it in code alone puts the app
  and the drawing out of step, which is exactly the class of bug this pipeline keeps finding.
  Carry the new wording to `/ask-design` with the reasoning, and let the drawing and the code
  change together.
- **A string no drawing carries** — most validation sentences, most notes — is ours. Change it,
  and say in the PR that it went through this loop.
- Either way the record is where the string ends up: the drawing and the code. The files in
  `tmp/copy/` are drafts, not an archive.

## 8. `tidy` — retire what is settled

`tmp/copy/` is a working folder. Left alone it becomes a second archive of decisions that
disagrees with the code, which is worse than no archive at all — somebody will quote it.

Threads are not what this step retires: they were closed in step 6, the moment their answer was
settled. **A thread still open here is a finding** — close it now and say in the report that it
was left open. What `tidy` retires is the drafts.

**A draft is retirable only when both hold:**

- its thread is settled — `ask_list` shows it `closed`;
- **the wording it settled is in the app.** This is the load-bearing check and unlike design's
  it is not a citation count, because copy answers are rarely cited by issue number. It is a
  grep for the chosen string:

  ```sh
  grep -rn "<the accepted wording>" app --include='*.ts' --include='*.tsx' | grep -v test
  ```

  A hit retires it. **No hit, no retirement** — the answer is either still unimplemented or was
  overruled somewhere, and both are things to find out rather than delete past.

The one exception: a string that step 7 routed to `/ask-design` will not be in `app/` yet. It
retires against the design question that now carries it — name the `questions/<…>.md` path, the
same way `/ask-design tidy` demands a path for a pair no issue cited.

**Then delete the draft** from `tmp/copy/`. Keeping a "just in case" copy of a decision is the
failure this step exists to prevent. What survives is what was always meant to: the string in the code, the drawing that carries it, and
`docs/copy-context.md` if the answer taught it something.

**A join prompt naming a closed thread is stale by itself**, and worse than a stale draft,
because pasting it sends the copywriter somewhere with nothing to do. Reset its thread line when
the thread closes, not at `tidy`.

Report what was retired and what stayed, with the reason for each. Never retire the draft of a
thread this loop is currently waiting on an answer for.
