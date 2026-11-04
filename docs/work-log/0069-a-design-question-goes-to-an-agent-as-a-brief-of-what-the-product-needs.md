# 0069. A design question goes to an agent, as a brief of what the product needs

- Date: 2026-11-04
- Issues: #391

## Context

`/ask-design` wrote a question, put a prompt on the clipboard and waited for someone to paste it into a
design chat. Since the design moved to artifacts (#953), those have no chat of their own, so the loop ended
at a paste with nowhere to go.

A trial on the Monday reminder for #391 (question `zz7oha4u`) ran the question through a subagent instead.
It read the documents, measured options at 390 px, drew in the document and published, with nobody pasting
anything.

The trial also showed what was wrong with the question itself. It asked for a row without `Ověření e-mailu`,
which cannot happen because the script writes that date with every application, and it mixed which fields
to show into a list of variants with my own guesses.

## Outcome

**`.claude/agents/ux-designer.md` answers design questions.** The session that asks writes under
`questions/`, keeps the index and checks the result against the files. The screens, components and tokens
are the agent's. That boundary stays from the chat days: a session writing into the screens would be
answering its own question in design's voice.

**A brief says what the product needs, which decisions are given and which data is on offer.** It carries no
variants and no recommendation, because a guess in the brief anchors the answer. Every state in it is checked
against the code first. Product, architecture and security are decided before the brief and stated as facts.
Which of the data a screen shows is a UX call, unless the product demands a field for certain.

**The session picks the agent's effort per spawn:** medium for decisions only, high when it draws, changes a
component or a token, or splits a document. The Agent tool allows setting it only when an instruction says
so, so the skill says so.

## What follows

An agent starts empty where a chat kept its history. What it should know has to stand in its file, in
`docs/_design-project.md` or in the documents' dated notes, and a repeated correction belongs there.

A change to the design system through the agent has not been tried, and neither has rebuilding its bundle,
which a chat on the source project used to do. The first real one is the proof.

Nobody sees the drawing rendered unless the user opens it: the browser pane isn't signed in to claude.ai, so
`check` says when only the markup was read.

`/ask-copy` still hands over a join prompt, because the copywriter is a participant in the shared room. The
same move could apply there later.

The current state is in [the design project](../_design-project.md).

## Turned down

- **The main session answering design itself.** It would grade its own question, and the boundary around the
  screens would go.
- **A separate Claude session to paste into.** It keeps the paste and buys nothing a subagent lacks.
- **A persistent copy of the chats' knowledge as a long brief per question.** It would drift, and the agent's
  file is read on every run.
