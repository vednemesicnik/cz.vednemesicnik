# 0057. A membership application lives in its cookie until the script stores it

- Date: 2026-11-01
- Issues: #396, #393

## Context

Membership is a legal act: the applicant fills in the details, prints and signs a declaration,
uploads the scan, and the app hands all of it in one signed request to the bound script (#394).
Between the steps they leave for a printer and a scanner, and the app stores nothing about an
application (#393). The script takes the application code as its idempotency key, and it mails
the applicant and the chair once. Log 0008 still covers the notice above the submit button.

## Outcome

- **One signed httpOnly cookie carries the whole flow**, scoped to `/organization/membership`.
  It holds `{ code, details }` for 30 days. A successful submit overwrites it with
  `{ code, email }` for one hour, so the details leave the browser with the application and the
  sent page can still show the address and the code. No personal data goes into a URL.
- **The code is generated when the details are saved**, not when they are submitted. Unchanged
  details keep their code, so a retry after a failure is one application. Changed details get a
  new code, because the script would take the old one for a duplicate and quietly keep the old
  details.
- **The rate limit counts only the submit**: 3 per hour per IP, on `signature` POSTs, before the
  body is read. Saving the details posts nothing anywhere, and counting it would spend two of the
  three attempts on one clean walk through the form.
- **The declaration is a resource route** that renders its own document with its own headers and
  a strict CSP. `entry.server` sets `X-Frame-Options: DENY` on every page it renders, so a normal
  route could not be framed. The frame is sandboxed without `allow-scripts`, so the printed
  document carries no behaviour, and it has no font or token from the site.
- **The scan's type comes from its first bytes**, on the client to refuse a pick at once and on
  the server because the browser's word proves nothing. The script checks a third time.

## What follows

- The first multi-step form on the site; `Stepper` is shared for #385's enrolment.
- The cookie is signed, not encrypted: the applicant's own details travel readable in it, in
  their own browser. Anything more sensitive would need another home.
- `documents/` ships in the image (`docker/fly/Dockerfile`) and holds the statutes. New statutes
  are a commit and a deploy.
- The limit is per IP, so a shared school network shares it; a reason to revisit if real
  applicants hit it.

## Turned down

- **`sent?id=…` from the epic**: the sent page needs the e-mail, and a code in the URL alone would
  not carry it. Personal data does not belong in a URL.
- **Clearing the cookie after a submit**: the sent page would have nothing to show after a reload.
- **Limiting every POST to the route**: see above; the first plan's limit counted the details step.
- **A generated PDF** (#393): the sheet prints from the browser, on any device, with nothing stored.
