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
existing departure or removal date. `enrol` refreshes an undecided row, and an empty `Stav` counts as
undecided, so the retry of a write that failed half-way repairs the row instead of hiding it. A decided
row with the same address and form date is the same application, and nothing is written.

## What follows

- The cache may evict, which costs nothing: each action is also idempotent on the sheet. So a change to
  an action has to keep that, not lean on the cache.
- Script writes can now change a `Stav` cell while the edit trigger waits for the lock, so the trigger
  re-reads the cell and skips an edit it no longer holds. A hand change can lose that race, and the person
  sees the script's value.
- `OWN_SECRET` sits in a project every domain account can read and copy, because the edit trigger needs that
  access (log 0060). Tried on 2 Nov 2026 on a throwaway project with a dummy value, from `admin@` as a Viewer:
  the settings hide Script Properties, and a project copy has none (`getProperties()` logged `{}` there and
  the value in the original). Google does not document this, so it rests on that one result, and it is the
  first thing to check if a secret from one of these projects ever turns up elsewhere.
- The text format does not stop a formula. `setNumberFormat('@')` followed by `setValue` or `setValues` runs
  `=1+1` and stores `2`, tried on Google on 2 Nov 2026 after a test here said otherwise, because the fake
  services behaved as the code assumed. In this project, text from a form goes through `writeTextCell_`, which
  adds a leading apostrophe: of the ways tried, only that kept both `=1+1` and `+420 600 000 000` exactly. Rich
  text without the format turned the phone number into a formula. `SCRIPT__Membership__Applications` wrote the
  way that failed, and `SCRIPT__Donate__Request_Confirmation` writes through `appendRow`, which also runs a formula
  and turned the IČO `01234567` into a number. Both add the apostrophe through their `literalText_`, in PRs of
  their own, tried on 3 Nov 2026. It holds through `setValues` on a row in the text format and through `appendRow`
  without a format, and an empty value has to stay empty.
- The writes were tried end to end on a throwaway copy of the project, with its own key and a scratch sheet
  of made-up people, not on the spreadsheet in use. So copy the project to try the next action.
- `ambiguous` needs someone at the sheet, so it reaches Sentry. `not_found` and `not_active` are answers
  about a person and do not.
- `SETTLED_ERRORS` in `post-signed-gas-request.server.ts` gains `ambiguous`, `missing_fields`,
  `not_active` and `server_misconfigured`, beyond the four in log 0061. A second attempt a second later
  changes none of them. `busy` stays transient.
- The new environment variables stay optional in production until #390 calls the client, as the
  membership client's did until its form shipped, so a release with this code needs no secret.
- Reactivation from `Vyřazení bez odpovědi` needs an action of its own in #392, since `confirmActive`
  refuses that person. Which of a person's addresses gets the September question is also #392's, and so
  are the pages for `not_found`, `not_active` and `ambiguous`, and what the ladder does with a shared
  address, which would otherwise keep mailing and then remove both people.
- #928 has to find the row with `splitEmailAddresses_`, keep a second address when it refreshes the
  contact details, and write the name with `writeTextCell_`. Otherwise it adds a duplicate and a name
  starting with `=` becomes a formula on `Kontakty`.
- #389's form has to apply the limits in the schema. A value the script refuses arrives only after the
  person confirmed by e-mail, as a settled `invalid_request`.
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
