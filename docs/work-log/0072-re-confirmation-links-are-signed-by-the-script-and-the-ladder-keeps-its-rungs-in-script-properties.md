# 0072. Re-confirmation links are signed by the script and the ladder keeps its rungs in Script Properties

- Date: 2026-11-06
- Issues: #392, #385

## Context

People leave the editorial board without telling anyone, so once a school year everyone is asked, with the departure
button in the same e-mail (#385, decision 9), and silence ends in `Vyřazení bez odpovědi` after a ladder of reminders.
The e-mails are composed in `SCRIPT__Editorial_Board__Membership`'s nightly job (log 0070), which cannot reach the
app's database, so their links cannot carry a token the app minted. The ladder runs over three months, and something
has to remember which rung each person already got: `Dotaz odeslán` keeps the round's start by its approved note,
and the mail service's idempotency cache lasts hours.

## Outcome

- **The script signs the links, the app verifies them.** A token is `<base64url JSON { email, action, exp }>.<hex
  HMAC-SHA256 of that string>` with `LINK_SECRET`, a key used for nothing else
  (`app/utils/editorial-board-activity/verify-activity-token.server.ts`, compared in constant time, before the payload
  is read). Signing the encoded string spares both ends agreeing on JSON key order. It is safe because every action
  is idempotent and opening the page writes nothing; only the press posts `confirmActive`, `leave` or `reactivate`.
- **Links expire with the round.** The question's and the reminders' at the start of the removal day, the removal
  notice's 30 days later; each e-mail prints the day before. An expired link points to redakce@, not to the next wave,
  which asks only `V redakci` and so would not ask someone already removed.
- **The address reaches the Fly log and the browser history, knowingly.** Unlike the enrolment's opaque
  token (log 0066), this one is readable JSON, so every opening of the page logs the member's address.
  The same people can read the log as the sheet, the log is short-lived, and an opaque token would need
  the database the script cannot reach.
- **The rung sent is a Script Property per round,** keyed by a hash of the link's address and the round's day, written
  right after the send with the round's day in its value, and pruned only once that round's removal day is past and
  the round is gone from the sheet.
- **Who is asked.** Named rows that share an address, directly or through another row, are one person, so no row
  belongs to two people. One e-mail goes to every valid address, and the link carries the alphabetically first address
  that finds all the rows again, so a removal leaves none of them published and a sort changes nothing. People sharing an address under different names, and rows of one
  name that no single address finds whole, are never asked and never removed.
- **Order.** The question is sent before `Dotaz odeslán` is stamped, and the removal notice before the removal is
  written, so a failed send never leaves someone in a round or removed without being told.
- **After an outage only the highest due rung goes,** and the removal goes ahead without a missed final warning,
  since a late warning's buttons would already be dead; the notice still gives 30 days to come back. A round with no
  rung on record at all is not removed on one e-mail: it starts again with the question.
- **A date typed into `Poslední potvrzení`** on or after the round's day ends the round. It is how the chief editors
  confirm someone still active who never answers (Libor, 6 Nov 2026).

## What follows

The first wave is started by hand with `startActivityWave()` when Libor decides; the scheduled one runs each
September. A wave larger than one run's budget resumes the next night, so a big first wave takes a few mornings.
`docs/_editorial-board-google-sheet.md` describes the current state. The note on `Poslední potvrzení` does not yet say
that a typed date ends a round; its wording waits on the copywriter.

## Turned down

- **A sheet column for the rung:** a new header with no approved note, and the chief editors could overwrite it.
- **The job's day stamp as the record:** a run resumed the next night would mail the same rung again.
- **The mail service's cache as the record:** it lasts hours, not weeks.
- **A final warning sent late after an outage:** its date and links would already have passed.
