# 0066. The enrolment form waits for its e-mail, and a button confirms it

- Date: 2026-11-03
- Issues: #390, #385

## Context

The form from the leaflet stored a pending enrolment and sent nothing (log 0065). The contract from
#388 had no action for the e-mail and left it to this issue, outside the write lock. A link in an
e-mail gets opened by Outlook Safe Links, antivirus scanners and prefetch, so opening it cannot be
what confirms. `react-router-serve` hard-codes `morgan("tiny")` (`cli.js:123`), which writes the whole
address to the log.

## Outcome

**The e-mail is `sendEnrolmentEmail`, an action beside the writes.** It touches no sheet and takes no
lock, so a slow Mailer holds up no write, and a project without the Mailer's properties still takes
the writes. A transport retry is keyed by `link` (log 0061), and the Mailer gets
`editorial-board:<sha256 of the link>`, so a retry of one request is one e-mail.

**The form waits for the send, up to 30 s an attempt.** A failed send says so and keeps the values.
This differs from sign-in (log 0062) because here there is nothing to hide: the page reads no sheet,
so its timing says nothing about an address. After a timeout the script keeps running, so the e-mail
may still arrive after the form showed an error.

**While a send is running, the same address mints no new token.** A new one would kill the link in the
mail on its way, and that mail may arrive last. The second request waits and shares the first one's
answer, so nobody reads that a link went out when the send then fails. Unlike sign-in (log 0062), the
sent page has no way to send again. It relies on one machine, like log 0062.

**The limit per address is 5 attempts an hour, and it shows,** with the wording already approved for
the IP limit. It counts attempts rather than sends, because after a lost answer the e-mail may have
gone out, and the limit is there for that mailbox.

**The link carries only the token, and the row is found by its hash.** The loader reads and nothing
else. The button writes first and spends the token after: a failed write leaves the link usable, and
`enrol` is idempotent on the address. The delete's count decides between two presses at once.

**The confirmed page opens only after a confirmation,** through a signed cookie for an hour, as the sent
page does. Without one it redirects to the form, so nobody reads „Přihláška je potvrzená" without having
confirmed.

**The token stays out of caches and referrers through middleware,** not a `headers` export forwarding
the loader's, which sees nothing on the action's `.data` answer, and none reaches an error page rendered
at a boundary above. `no-transform` is there because the page shows the address, and Cloudflare would
hide it from anyone without JavaScript.

**The token does reach the Fly log, knowingly.** The log is short-lived and only people who can see the
data anyway can read it, and sign-in's link has the same exposure today.

## What follows

`GAS_EDITORIAL_BOARD_MEMBERSHIP_URL` and `_SECRET` are required in production, so the Fly secrets go in
before the release, or the app does not boot. The script's `MAILER_URL`, `MAILER_SECRET` and
`NOTIFICATION_RECIPIENT` are Script Properties, because a reader of that project sees its code.

A custom server would be a reason to take the token out of the log, for sign-in as well. A second
machine would be a reason to move the in-flight guard and the limit out of process memory.

## Turned down

- **Sending in the background, as sign-in does.** There it hides whether an account exists. Here it
  would promise an e-mail on a page that cannot know one went out.
- **A silent limit and always the same result page,** from the epic's flow A. The page reveals nothing
  either way, and silence would leave someone waiting for mail that never comes.
- **A CSRF token on the confirmation.** The link's token is the authority and a foreign page does not
  know it. A CSRF cookie would only fail a link opened in another browser.
- **An index on `Verification.secret`.** There are few such rows, and the sweep deletes them after 72
  hours.
- **A custom server to keep the token out of the log.** Out of proportion to a short-lived log.
- **The token on the confirmed page.** It would have to outlive the confirmation, and it would stay in
  the address, the browser's history and the log with nothing left to protect.
- **A 404 without the cookie.** Someone coming back after an hour would read it as something broken.
