# 0062. The sign-in request answers before it looks the address up

- Date: 2026-11-02
- Issues: PR #934

## Context

The magic-link request answers every address with the same neutral redirect, so as not to
say whether an account exists. Its timing said it anyway:
`app/routes/administration/sign-in/magic-link/_action.ts` awaited the lookup, then, only for
an existing account, the token write and the Apps Script send.

Measured on the production build against a local stub for the script, the difference equals
the time the send takes. One request is enough to read it, so the IP limit of 5 per 15 minutes
slows a sweep without stopping a look at one address. The `ALLOWED_EMAIL_DOMAIN` gate narrows
the question to addresses on our domain, which are the ones worth asking about. A real person
paid for the await too: up to 8 s when Google hangs, and about twice that with the retry in
#387.

## Outcome

The action answers first. Everything that depends on the account (lookup, token write, send)
runs in `issueSignInLink` (`app/utils/magic-link/issue-sign-in-link.server.ts`), started by a
50 ms timer. It never rejects; a failure is logged and reported to Sentry, and a failed send
is reported by `sendMagicLinkEmail` as before.

Time to the redirect, median (p10 to p90), in milliseconds:

| | account | no account |
| --- | --- | --- |
| Before, stub answers in 1500 ms (n=8) | 1507 | 3 |
| Before, stub answers at once (n=200) | 8.6 (6.4 to 10.5) | 4.2 (2.8 to 5.4) |
| Not awaited, no delay, stub at once (n=200) | 6.0 (4.3 to 8.6) | 3.9 (2.9 to 5.8) |
| 50 ms delay, stub at once (n=300) | 4.76 (2.81 to 6.94) | 4.93 (2.88 to 7.02) |
| 50 ms delay, stub answers in 1500 ms (n=8) | 3.6 | 2.9 |

The delay is there because `better-sqlite3` is synchronous: a token written before the answer
leaves still holds it back. `react-router-serve` has no hook for when a response has finished,
and `setImmediate` would fire before the cookie is signed.

While a link for an address is on its way, another sign-in request for that address does
nothing. The page now appears at once, so "Poslat znovu" can be pressed during the send, and a
new token would kill the link in a mail that may still arrive last. This relies on one machine.

## What follows

The difference is reduced to noise, not to zero. The synchronous write still blocks the event
loop for a moment about 50 ms after the answer, and only POST is limited, so a concurrent GET
could in principle see a stall of a couple of milliseconds. Against network jitter that needs
far more samples than the limit allows. A write much slower on Fly than measured here, or a
limiter that stops holding, would be a reason to look again.

A send cut off by a deploy or a crash now goes unnoticed: the person has already seen the sent
state, and nothing is logged. They recover with "Poslat znovu", and the window is seconds per
deploy, so this is accepted. So is a dropped second request when the first send then fails: the
failure is reported, and pressing the button again works.

The identity check (`settings/verify-identity/magic-link/_action.ts`) keeps awaiting. The person
is signed in and is told the result. It and the invitation
(`users/new/utils/send-invitation.server.ts`) stay outside the guard above, so either can replace
the token of a sign-in mail still being sent, and the other way round. Anyone can already replace
a live link by requesting one for the address. It costs one dead link, and asking again replaces
it, so this is accepted too.

Password sign-in has its own timing difference: `bcrypt.compare` runs only for an account with
a password. It is off unless `ALLOW_PASSWORD_SIGN_IN` is set, so it is left as it is.

## Turned down

- **Keeping the await and relying on the limit.** One request reads the answer, and the wait
  stays.
- **Not awaiting only the send, with the lookup and token write still in the action.** Leaves
  the write's few milliseconds on the answer.
- **Padding the answer to a fixed time.** Slows everyone, and a hang longer than the pad still
  shows.
- **A queue or a worker thread.** Nothing else needs one, and it would have to survive the same
  deploys.
- **Chaining a second request after the first.** It keeps the order of the mails, but the queue
  for one address grows with each request and every mail in it but the last is dead on arrival.
