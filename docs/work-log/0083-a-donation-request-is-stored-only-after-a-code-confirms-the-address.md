# 0083. A donation request is stored only after a code confirms the address

- Date: 2026-11-13
- Issues: #104

## Context

The request for a donation confirmation (`/donate/request-confirmation`) posted straight to
`SCRIPT__Donate__Request_Confirmation`, which wrote a row and mailed the acknowledgement from
`oznameni@` to whatever address was typed. Anyone could fill the requests sheet and mail strangers.
The request carried the script's `OWN_SECRET` bare in its body, and that secret was a 3-character
placeholder. The sent page showed a request code taken from `?id=` unchecked.

## Outcome

- **The address is confirmed by a code before anything is stored**, as for the membership
  application (log 0073): the form saves the details in a signed cookie (7 days) and mails an
  eight-character code; the verify step takes it, and the right code sends the request at once.
  Two steps, `Údaje` and `Ověření a odeslání` (design 15l, 15m, 15n; copy thread 5uc4li12).
- **The code helpers serve any form.** `app/utils/email-verification/` makes, checks and issues a
  code for a `purpose` (`membership-verify`, `donation-verify`), which is part of the signed
  message, so a code never passes in the other form. Each form has its own secret;
  `DONATION_VERIFICATION_SECRET` is required in production.
- **The request is signed** (`postSignedGasRequest`), and the script checks the signature
  (`Toolkit.readSignedRequest`, 300 s). The request code (`2025-K7M2QX`) is the idempotency key: a
  retry, or a replay inside the window, finds it on the year's tab under the script lock and stores
  and mails nothing.
- **The script checks every field's shape and length**, the same limits as the form
  (`DONATION_FIELD_LIMITS`), so a leaked secret can store only a request shaped like the form's,
  and mail only a code-shaped string. `Toolkit.isValidEmail` (Toolkit 13) replaces two per-project
  copies.
- **The sent page reads the request code from the cookie**, never from the address.
- **A confirmed address stays confirmed** in the cookie: a failed write offers *Odeslat žádost*
  without a code, details the script refused go back to the form, and corrected details with the
  same address mail nothing.

## What follows

Release order: Toolkit 13, then the script with a new long `OWN_SECRET` set on both sides
(`GAS_DONATION_CONFIRMATION_SECRET`), then the app with `DONATION_VERIFICATION_SECRET`
(`docs/_deploy-to-fly.md`). The limits and the in-flight guard live in process memory, as in
log 0073.

## Turned down

- **A link in the e-mail with a pending row**, as in the enrolment: a request with a date of birth
  would wait server-side, and a link opened on the phone cannot reach the cookie on the computer.
- **Storing at once with an "unverified" flag:** the sheet would still fill with junk.
- **Only stronger limits or a captcha:** mail would still go to other people's addresses.
- **Reusing `MEMBERSHIP_VERIFICATION_SECRET`:** one secret, one purpose, as log 0073 promised.
