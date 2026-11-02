# 0061. A retry of an Apps Script call is opt-in and names its key

- Date: 2026-11-02
- Issues: #387, #384, #385

## Context

POSTs to an Apps Script `/exec` answered 404 about twice in fourteen calls in
`cz.vednemesicnik.billing`, always out of the automatic redirect walk (#384). No cause was found.
It did not matter much while the only caller that cared was the best-effort magic-link send. It
matters for the writes in #385, where a lost write is an enrolment nobody ever learns about.

Billing retries every call, which it can because every write it makes carries a key. Here the
scripts differ. `SCRIPT__Users__Notice_Send` keys the e-mail change notice on the request signature
(`send-email-change-notice-email.gs`), and a retry has a new timestamp and so a new signature, so a
blanket retry would mail the person twice.

## Outcome

`postGasRequest` walks the redirect itself for every caller and logs each hop. It does not retry.

`postSignedGasRequest` tries a transport failure once more only when the caller names a field of
the payload that identifies the unit of work (`idempotencyKeyField`) and that field holds a
non-empty string. Without a key there is one attempt. Four codes are never retried:
`invalid_request`, `not_found`, `stale_timestamp` and `unauthorized`. An unknown code counts as
transient.

The attempts are a second apart. A timestamp counts whole seconds, and at 400 ms, billing's delay,
a local run sent the same timestamp and signature twice. A retry that rescues a request is reported
to Sentry as a warning, since Fly's logs last minutes and nobody would otherwise learn whether the
retry earns its keep.

Only `magic-link` opts in, and its key is the `link`. That is minted per request, it is already in
the signed payload, and the script hashes it into the key it gives the Mailer
(`build-idempotency-key.gs`). The Mailer keeps a key for 6 hours, against under 20 seconds of
attempts here.

## What follows

**A script that opts in has to answer a repeat with the first result, not with a refusal.** A
`replayed` error does not tell the caller whether the work happened, so a retry after a lost answer
would report a successful write as failed. `SCRIPT__Drive__Invoice_Pdf` dropped `reject-replay.gs`
for this reason (its `idempotency.gs`), and #388 has to settle the same question before its writes
opt in.

The sign-in request no longer waits for the send (log 0062), so the wait falls on the identity check
in Settings: from 8 to about 17 seconds when Google hangs. The 404s seen so far were quick. After a
timeout the first attempt may still be running, and the Mailer's check is
not under a lock, so two copies of one link can go out. That is a nuisance, not damage.

Revisit if the Sentry warning never fires, which would mean the retry buys nothing here, or if it
fires often, which would make the 404 worth diagnosing after all.

The current state is in [Apps Script web apps](../_apps-script-web-apps.md), with why each of the
other endpoints does not opt in.

## Turned down

- **A retry inside `postGasRequest`, as in billing.** It would double the notice above.
- **A new `idempotencyKey` field in the magic-link payload, as #387 first asked.** The script's
  contract forbids extra fields and nothing there would read it. Changing that means another release
  on the path where a mistake locks administrators out, for no gain over the `link`.
- **Retrying only the second hop.** It would avoid running the script twice, but it is a second
  retry path for a failure no one has yet located.
