# 0037. Apps Script web apps are split by privilege

- Date: 2026-10-22
- Issues: #771, #770, #563

## Context

The app talks to Google through Apps Script web apps in their own repositories. Every
`/exec` address is public, so what a leaked secret can do is bounded only by what the web app
behind it accepts. The estate already composed from primitives: the Mailer
(`SCRIPT__Mail__Send`) is the only project that sends, `SCRIPT__Toolkit` is the shared
library, and each web app around them validates one caller's job.

#563 added the invitation of a new user to `SCRIPT__Auth__Magic_Link` as a second request
`kind`, and #770 needed a third e-mail about an account: the notice to the old address after
an e-mail change. Adding kinds to the sign-in script would make one secret and one deployment
carry jobs that have nothing to do with signing in. At the same time each web app was copying
the same validation (`authenticate-request.gs`, `is-allowed-email.gs`, `is-allowed-link.gs`,
`build-idempotency-key.gs` in magic-link).

## Outcome

- **One web app per set of privileges**: the caller, the recipients it may write to, the data
  it can reach, and the account it is deployed under. Requests that share all four share a web
  app; one that differs in any of them gets its own.
- **Only the Mailer sends.** A web app renders and validates, then delegates through
  `Toolkit.sendViaMailer`; it holds no send scope.
- **Toolkit holds the shared validation**: `readSignedRequest`, `isAllowedEmail`,
  `isAllowedLink`, `isSingleLineName`, `buildIdempotencyKey` (Toolkit 7). A new web app is its
  configuration, its template and the checks on its own fields.
- **A deploying account is neither a mailbox nor the domain administrator** unless the job
  needs one. A mailbox account holds only its Mailer; a domain administrator's clasp token does
  not belong in CI for a job without admin authority.
- **`SCRIPT__Auth__Magic_Link` sends only the sign-in link.** Notices to an administration user
  about their account go through **`SCRIPT__Users__Notice_Send`**, deployed under the web's own
  app account and sending through the notifications mailbox's Mailer. The invitation is its
  first kind; the e-mail change notice (#770) is its second.

## What follows

- A new e-mail or Google job first asks the four questions. A notice that goes to an address
  off the domain, or that a public form triggers, does not join `SCRIPT__Users__Notice_Send`;
  it gets its own web app, as the donation confirmation request already has
  (`SCRIPT__Donate__Request_Confirmation`).
- A new web app's name says what it does: the area, then the object and the action
  (`Users__Notice_Send`). Older names such as `Auth__Magic_Link` predate this.
- Each web app the app calls registers in `constants/gas-endpoints.ts`, commits its schema
  under `schemas/`, and has its own `GAS_*_URL` / `GAS_*_SECRET`; see
  [`_deploy-to-fly.md`](../_deploy-to-fly.md). Which account deploys which repository lives
  in the `apps-script-ops` repository.
- Magic-link drops its `invitation` kind one release after the app sends invitations through
  `users-notice`. Moving magic-link off the domain administrator's account, and magic-link and
  Donate onto the Toolkit primitives, are open follow-ups, not part of this entry.

## Turned down

- **One shared mail script** for the sign-in link, account notices and the donation
  confirmation. Its validation would be the union of all of them, so a single leaked secret
  would send to donors' addresses outside the domain; it would need every scope and one account;
  and a template change for donations would redeploy sign-in, where a mistake locks
  administrators out.
- **A `kind` per notice on magic-link.** Ties account notices to the sign-in secret and
  deployment for no gain.
- **The app calls the Mailer directly.** The app's secret would then send anything to anyone
  from the mailbox; the validating web app is what bounds a leak.
- **A web app per notice.** The invitation and the e-mail change notice share every privilege;
  splitting them doubles repositories, deployments and secrets for no added bound.
- **Deploying under the notifications mailbox or the domain administrator.** Turned down for
  the reasons in the Outcome above.
