# 0009. No transparent bank account

- Status: Accepted
- Date: 2026-09-28
- Issues: #104

## Context

The donation page was drawn with a running total and a link to a transparent account, which
would need a bank API.

## Decision

The association has no transparent account, because a public account invites scams. The
donation page shows no total and no account link, and nothing calls a bank API. The thank-you
section stays without an amount.

## Consequences

- Proposals to show donation totals or to connect a bank are off the table while this
  stands.
