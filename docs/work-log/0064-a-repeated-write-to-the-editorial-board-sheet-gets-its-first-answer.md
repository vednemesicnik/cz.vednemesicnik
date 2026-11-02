# 0064. A repeated write to the editorial-board sheet gets its first answer

- Date: 2026-11-02
- Issues: #388, #385

## Context

Decision 3 on #385 and the first text of #388 asked `SCRIPT__Editorial_Board__Membership` for a
`reject-replay.gs` and a `replayed` error, as `SCRIPT__Drive__Invoice_Pdf` once had. Log 0061 then
left the question open: a refusal does not tell the caller whether the work happened, so a retry after
a lost answer would report a successful write as failed. That script had already dropped its
`reject-replay.gs` for this reason (its `idempotency.gs`).

Libor also found a person with two addresses in one `E-mail` cell on `Kontakty`, which an exact match
would have treated as nobody.

## Outcome

A repeat of an `idempotencyKey` answers with the stored first result and `idempotent: true`, and writes
nothing. A retry and a captured envelope replayed verbatim carry the same key, so one cache covers both,
and past 300 seconds the signature check has already refused the envelope. This reverses decision 3.

The key is random per POST and the cache holds it for 15 minutes. It is minted in
`postEditorialBoardMembershipWrite`, so a route cannot pass one. A new press of a button is a new key,
and the state of the sheet decides.

The key is checked inside the script lock, which the edit trigger shares, so a second attempt waits for
a first one that is still running after a client timeout.

An `E-mail` cell may hold several addresses, and a row is found by any of them. Rows with one name all
change. Rows with different names write nothing and answer `ambiguous`.

`confirmActive` writes only for someone `V redakci` and otherwise answers `not_active`. `leave` keeps an
existing departure date. `enrol` treats an address with the same form date as the same application, in
any `Stav`.

## What follows

- The cache may evict, which costs nothing: each action is also idempotent on the sheet. So a change to
  an action has to keep that, not lean on the cache.
- Script writes can now change a `Stav` cell while the edit trigger waits for the lock, so the trigger
  re-reads the cell and skips an edit it no longer holds. A hand change can lose that race, and the person
  sees the script's value.
- `ambiguous` needs someone at the sheet, so it reaches Sentry. `not_found` and `not_active` are answers
  about a person and do not.
- `SETTLED_ERRORS` in `post-signed-gas-request.server.ts` gains `ambiguous`, `missing_fields` and
  `not_active`, beyond the four in log 0061.
- Reactivation from `Vyřazení bez odpovědi` needs an action of its own in #392, since `confirmActive`
  refuses that person. Which of a person's addresses gets the September question is also #392's.
- Revisit the shared-mailbox rule if `ambiguous` keeps firing on the same people.

The current state is in [Apps Script web apps](../_apps-script-web-apps.md) and the project's README.

## Turned down

- **`replayed`, as first asked.** See above. Keeping it also for verbatim replays would need a second
  cache of signatures, and all it adds is refusing a re-run of a failed envelope within 300 seconds by
  someone who already captured it.
- **A key derived from the link, kept for 6 hours.** Confirm, leave and confirm again from one e-mail
  would answer success to someone `Mimo redakci`.
- **`confirmActive` writing for anyone, as the issue reads.** A person who left and pressed an older button
  would be thanked for staying while the web no longer shows them.
- **Applying a shared address to every row.** One `leave` from a shared mailbox would take a stranger off
  the web.
