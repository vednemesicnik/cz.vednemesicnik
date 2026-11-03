# 0065. A pending enrolment waits in `Verification`, and a whole room may send the form together

- Date: 2026-11-03
- Issues: #389, #385

## Context

The form from the leaflet (design 15e, `/editorial-board/enrolment`) is filled in on a phone during
a meeting. Nothing reaches the sheet until the person confirms by e-mail (#390), so name, phone and
interest have to wait somewhere for up to 72 hours. Decision 13 on #385 keeps a contact after someone
leaves, while the first drawn notice promised to keep it only „po dobu vašeho působení v redakci".

The issue assumed the `donate-page` branch had landed. It has not, and the shared form parts it was
meant to promote are already in `app/components/`.

## Outcome

**The details wait in `Verification.payload`**, as JSON, on a row of type
`editorial-board-enrolment`. The link carries only the token, whose hash is stored. A daily sweep
deletes expired rows, since unlike a sign-in link nothing has to use such a row up.

**The address reaches the sent page in a signed cookie** for an hour, as in log 0057, because
personal details do not belong in a URL.

**The limit is 20 submissions an hour per address**, not the 3 the issue asked for. A room shares one
Wi-Fi or one operator address (log 0057 names the same problem), and whoever gets a 429 at the
meeting does not come back after it. #390 adds a limit per e-mail address, because that is where mail
leaves and where someone can be flooded.

**A public form has its own CSRF check.** `checkPublicCSRF` is `checkCSRF` without the session and
with the form's own message. Honeypot, CSRF and the limit run in that order.

**The notice says what happens** (thread `13o2gns1`, drawn in 15e as `3j9r2h6x`). Someone accepted
stays on `Kontakty` with no time limit, even after leaving, so that the editors can stay in touch.
They are deleted by hand on request through `udaje@vednemesicnik.cz`. An application goes 12 months
after its confirmation, and an unconfirmed one when its link has expired.

**`AdminTextarea` is now the shared `TextareaField`**, since a public route should not import from
`admin/` and #537 rules out a second copy.

## What follows

Until #390 lands the sent page says a link was sent and none is, so #389 and #390 belong in one
release. Nothing links to the page and the leaflet does not exist yet, so an earlier release would
reach only someone who guesses the address.

The name rules in `_schema.ts` copy `Toolkit.isSingleLineName`, and the limits come from
`schemas/editorial-board-membership`. What the script refuses arrives only after the e-mail
confirmation, with no way out, so a change there has to reach the form as well.

Contacts of former members staying with no time limit is a legal risk the notice states truthfully
but does not settle. Libor owns that call; it has had no legal review.

## Turned down

- **3 submissions an hour**, from the issue: it refuses the fourth person in the room.
- **Deleting a contact 12 months after someone leaves.** Better for data protection, but it reverses
  decision 13, and a manual `Mimo redakci` records no date to count from.
- **The details in the link.** They would leak into the e-mail and every log that sees the URL.
- **Promoting the components from `donate-page`.** That branch is unmerged, and it can take the
  shared parts from here when it lands.
- **A stub or a switch until #390.** The contract has no action to call yet, and the page is unlinked.
