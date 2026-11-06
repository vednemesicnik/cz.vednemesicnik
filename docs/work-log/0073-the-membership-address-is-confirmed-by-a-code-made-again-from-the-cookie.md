# 0073. The membership address is confirmed by a code made again from the cookie

- Date: 2026-11-06
- Issues: #972, #393

## Context

The membership application wrote a row and filed a scan as soon as the signature step was
submitted (log 0057), and nothing checked that the address was the applicant's. A bot or a prank
could fill the leadership's sheet and send the acknowledgement to someone else's mailbox. The
enrolment form has no such hole: nothing reaches its sheet until a link in the e-mail is confirmed
(logs 0065, 0066). But decision 2 of #393 is that the app stores nothing about an application, and
the flow already crosses devices, because the declaration is printed and scanned.

## Outcome

- **Saving the details mails a code, and the signature step takes it before the upload.** The code
  is eight characters of the application code's alphabet, the HMAC-SHA256 of `membership-verify`,
  the lower-cased address and `issuedAt` with `MEMBERSHIP_VERIFICATION_SECRET`, read as one number in
  base 31 (`app/utils/membership-application/create-verification-code.server.ts`). Only `issuedAt`
  goes into the signed cookie, beside the details; the code is made again to check it, in constant
  time, and lives 24 hours (`app/config/membership-application-config.ts`).
- **A correct code writes `verifiedEmail` into the cookie, and the submit is refused without it**,
  before the body is read. Saving the details with the same address keeps the verification, or a live
  code, and mails nothing. A new address needs a new code.
- **A failed send stores nothing.** The applicant stays on the details, the next *Pokračovat* sends
  another code, and a code from the failed attempt never verifies, even if its e-mail arrives. A
  failed *Poslat znovu* keeps the live code.
- **Sending is limited where it happens, not before the body.** 10 codes an hour per IP and 5 per
  address are counted in the action, only when an e-mail is attempted, as in log 0066. 20 code tries
  an hour per IP and the 3 submits stay in the middleware, told apart by `?intent=` in the address,
  because a code form and the multipart submit post to the same step.
- **The script only delivers the code.** `sendVerificationCode` in `SCRIPT__Membership__Applications`
  takes no lock, touches no sheet and needs only the mail service's properties. Its key in the mail
  service is `membership:verification:<email>:<code>`, so a retry of one request is one e-mail. The
  e-mail carries the code alone. Design 15k and 15h, copy thread `zup07jj5`.

This changes log 0057 in one point: saving the details now posts something, an e-mail, so sends get
their own limits. The cookie still carries the whole application, and decision 2 holds: no row, no
migration, no sweep.

## What follows

`MEMBERSHIP_VERIFICATION_SECRET` is required in production and shared with no script
(`docs/_deploy-to-fly.md`). Changing it only makes the codes on their way invalid. The script's
release goes before the app's.

The limits and the in-flight guard live in process memory, like sign-in's (log 0062). A second
machine would be a reason to move them. So would people on one school network hitting 10 sends an
hour.

## Turned down

- **A link with a pending row in `Verification`, as in the enrolment.** It leaves an e-mail at rest
  for an abandoned application, against decision 2. A link opened on the phone cannot reach the
  cookie on the computer where the details live.
- **Confirming at the end, as in the enrolment.** That would hold the signed scan and the date of
  birth server-side until the click.
- **Only stronger limits or a captcha.** They slow a bot down, but mail still goes to someone else's
  address.
- **The code in the cookie.** The cookie is signed, not encrypted, so the applicant, or a bot, could
  read it there.
- **The intent in the body, as Conform intents.** The middleware would have to read an 8 MB upload to
  know which limit counts.
