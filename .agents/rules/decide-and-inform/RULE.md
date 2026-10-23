---
name: decide-and-inform
description: |
  Make architecture, product, security and process calls yourself and report them; do not ask the user.

  Trigger for:
  - Being about to ask the user an architecture, product, security or process question
  - Being about to ask which of several implementation approaches to take

  DO NOT trigger for:
  - Outward or irreversible actions, facts only the user has, and clipboard handovers — those are still asked
  - UX, layout and visuals (the design project) and user-facing Czech (the copywriter)
---

# Decide and Inform

When you have a recommendation, the call is yours: decide, then tell the user what you
decided. A question they would answer with your recommendation only stops their work
(log 0018).

## How

1. **Read first.** `docs/` and `docs/work-log/` settle most of the frame; a call they
   already make is not a call unless there is a reason to change direction.
2. **Weigh it.**
   - A small or easily reversed call: decide inline.
   - A weighty or hard-to-reverse one (a data model, permissions, authentication, routes, a
     migration, the order of work): first hand your recommendation to a subagent in a fresh
     context, asked to refute it against `docs/` and the work log. Resolve its
     objections, then decide.
3. **Report it** in a line or two, with what you turned down:

   ```
   Decided: invoices keep a version history table — credit notes must point at the
   version that was sent. Turned down: a JSON snapshot column, which nothing could query.
   ```

4. **Log it** with `/log-work` when later work should know it.

The user can overrule any reported decision; that is the check, not a question up front.

## Still ask

- **Outward or irreversible actions** — merging, closing an issue, posting a comment,
  deploying, deleting data, anything in production.
- **Facts only the user has** — people, the organization, money, agreements.
- **Handovers** — a prompt the user has to paste into another chat.

UX still goes to the design project (`/ask-design`) and Czech to the copywriter
(`/ask-copy`).
