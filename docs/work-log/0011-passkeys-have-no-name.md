# 0011. Passkeys have no name or note

- Date: 2026-10-11
- Issues: #554, #556

## Context

Two passkeys can get the same automatic name (two Macs, both „Mac, Chrome“). Renaming a
passkey, or adding a note to it, was proposed so they could be told apart.

## Outcome

Passkeys cannot be renamed and have no note. A row tells them apart by when the passkey was
added and last used. Since #556, removing the wrong one costs an identity check and adding it
again, with no sign-out, and Google and the e-mail link remain the main ways to sign in.

## What follows

- Reopen only if passkeys are actually removed by mistake.
- A different variant, such as marking "this device", is a new proposal for `/review-idea`.
