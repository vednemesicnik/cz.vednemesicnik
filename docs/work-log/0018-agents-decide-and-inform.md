# 0018. Agents make architecture, product and security calls and report them

- Date: 2026-10-15

## Context

The skills sent architecture, product and security calls to the user as questions, each with
the agent's recommendation first: `/ask-design` for a product decision, `/review-idea` when the
evidence left a verdict open, `/record-decision` when two records were in tension, and
`/implement-issue` and `/ship-issue` when a plan left a fork open or a fix had several
approaches. The user almost always picked the recommendation, the frame being already set by
`docs/` and the decision records, and each question stopped work on both sides.

## Outcome

An agent with a recommendation makes the call and then reports it, with what it turned down.
A weighty or hard-to-reverse call (a data model, permissions, authentication, routes, a
migration, the order of work) first goes to a subagent in a fresh context, asked to refute
the recommendation against `docs/` and the decision records. A call that binds later changes
gets a record, `Accepted` from the start. The user overrules a reported decision by saying
so. The convention is the rule `.agents/rules/decide-and-inform/RULE.md`.

The agent still asks about outward or irreversible actions (a merge, closing an issue, a
comment, a deploy, deleting data), about facts only the user has (people, the organization,
money, agreements), and when it hands over something the user has to paste.

## What follows

- `/ask-design`, `/review-idea`, `/record-decision`, `/implement-issue` and `/ship-issue` point
  at the rule instead of asking. The merge question in `/ship-issue` and the handover
  confirmations stay.
- The check moves from a question up front to the report and the pull request: a decision is
  visible in the agent's report, in the PR and, when it binds, in a record.
- UX stays with the design project and Czech with the copywriter. Deciding whether something is
  a page or a dialog ([0016](0016-records-are-added-and-edited-on-their-own-page.md)) is one of
  the calls the agent now makes.
- It is a single convention with one trigger, so it is a rule, not a skill
  ([0014](0014-activity-guidance-is-a-skill-not-a-rule.md)).
- Revisit if reported decisions are overruled often: that means the frame in `docs/` is
  missing something, and that gap is what to fix.

## Turned down

- **Keep asking, recommendation first.** The previous practice, and the one the user asked
  to stop: it costs a round trip for an answer that is almost always the recommendation.
- **Decide without a second opinion.** It is cheaper, but a weighty call then rests on one
  context that may carry an unchecked premise. A fresh subagent is the cheapest independent
  check.
