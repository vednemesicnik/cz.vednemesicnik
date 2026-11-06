# Editorial board from a Google Sheet

The editorial board (redakce) shown on `/editorial-board` has a **private Google Sheet** as
its source of truth. The chief editors edit the sheet directly — no administration sign-in —
and the app reads the public subset (names + role labels of active members) through a
**Google Apps Script web app protected by a shared secret**. This is the same pattern as
the magic-link email (`SCRIPT__Auth__Magic_Link`): no Google Cloud project, no service
account, the sheet stays private.

Two standalone Apps Script projects work with the one spreadsheet, each in its own **private**
repo (the links 404 without access). Neither is bound to the sheet, because everyone who edits a
bound sheet also edits its project (log 0059). Log 0060 says why there are two.

| Project | What it does |
| ------- | ------------ |
| [`SCRIPT__Editorial_Board__Contacts`](https://github.com/vednemesicnik/SCRIPT__Editorial_Board__Contacts) | Answers the read for `/editorial-board`. Never writes. |
| [`SCRIPT__Editorial_Board__Membership`](https://github.com/vednemesicnik/SCRIPT__Editorial_Board__Membership) | The only project that writes: the setup, the edit trigger, the signed writes from the app and the scheduled jobs. |

Their READMEs have the steps for each project. [Apps Script web apps](_apps-script-web-apps.md)
shows where both sit among the scripts the web uses.

> **Note:** the spreadsheet doubles as the internal contact directory (e-mail, phone,
> notes). The endpoint **never** reads those columns — it returns only names and role
> labels of members whose `Stav` is `V redakci`.

## 1. The spreadsheet

There is one, **"Vedneměsíčník — Redakce"**, shared as Editor with the web's app account. It
recovers from its version history, so nothing builds a new one from scratch.

## 2. The setup script

In the Membership project, select `setupSpreadsheet` and **Run**. It is made for the populated
sheet and is idempotent: it adds missing headers, deletes nothing and leaves the values in `Role`
alone. It requires `Kontakty` and `Role` to exist. Name a version in the spreadsheet's history before
its first run.

It adds `Telefon` and the lifecycle columns to `Kontakty`, sets the row colours, creates `Přihlášky`,
and on the first run gives each named row a `Stav` from the old `Aktivní` checkbox. That column is
then removed by hand, once the read has moved to `Stav`.

### Manual settings the script can't do

The Sheets API exposes neither setting ([googleapis #2676](https://github.com/googleapis/google-api-python-client/issues/2676)),
so they are set in the UI on the `Role` column of `Kontakty` — **Data ▸ Data validation ▸** the
rule — and the script never applies that rule again, which would drop them:

- **Multi-select** — switch the dropdown **Display style** to **Chip**, then enable
  **Allow multiple selections**. The toggle stays greyed out until the dropdown is
  chip-style. A member can then hold several roles and appears in each section on the web.
- **Chip colors** — pick a color per role option in the same dropdown editor.

`Stav` on `Kontakty`, and `Stav` and `Role` on `Přihlášky`, show chips too, set the same way, with a
color per `Stav` value. The script compares the `Stav` list and applies the rule again only when it differs.

## 3. Reference: sheet design

Column headers are in Czech — the editors are the audience — and both projects locate columns
**by header label**, so they may be reordered (within each sheet) without breaking anything. The
labels, values and notes went through the copywriter; they live in the Membership project's
`config.gs`.

**`Role` sheet** (protected — owner-only edits):

| Column | Header             | Example                     | Notes                                  |
| ------ | ------------------ | --------------------------- | -------------------------------------- |
| A      | `Role`             | název role v jednotném čísle | value shown in the `Kontakty` dropdown |
| B      | `Označení na webu` | název role v množném čísle    | section heading rendered on the web    |
| C      | `Pořadí`           | 1                           | sorts the sections on the web          |

**`Kontakty` sheet**:

| Header               | Type             | Notes                                                        |
| -------------------- | ---------------- | ------------------------------------------------------------ |
| `Jméno`              | text             | member's full name; a member is a row with a name            |
| `Role`               | dropdown (chips) | validated against the `Role` sheet, rejects unknown values   |
| `E-mail`             | text             | internal only — never returned by the endpoint; one cell can hold several addresses, separated by commas, semicolons or spaces, and the row is found by any of them |
| `Telefon`            | text             | internal only — never returned by the endpoint; added beside `E-mail`, filled from an accepted application |
| `Poznámka`           | text             | internal only — never returned by the endpoint               |
| `Stav`               | dropdown         | `V redakci` is published on the web; `Mimo redakci` and `Vyřazení bez odpovědi` are not |
| `Poslední potvrzení` | date             | empty means none on record, not that the person did not confirm |
| `Dotaz odeslán`      | date             | start of the current round of the question, from #392        |
| `Odchod či vyřazení` | date             | not filled when somebody changes `Stav` by hand              |
| `Odeslání formuláře` | date             | copied from the application on acceptance                    |

`Mimo redakci` means the person is not part of the editorial board right now: they left, stopped
contributing or are on a pause. `Stav` claims no reason.

**`Přihlášky` sheet**: applications until the chief editors decide, apart from the directory of
people who are in the editorial board. A row arrives when someone presses the button on the
confirmation page, and accepting moves the person to `Kontakty`.

| Column | Header               | Type     | Notes                                                        |
| ------ | -------------------- | -------- | ------------------------------------------------------------ |
| A      | `Jméno`              | text     |                                                              |
| B      | `E-mail`             | text     |                                                              |
| C      | `Telefon`            | text     |                                                              |
| D      | `Zájem o činnost`    | text     | optional answer from the form; copied to an empty `Poznámka` on acceptance |
| E      | `Odeslání formuláře` | date     |                                                              |
| F      | `Ověření e-mailu`    | date     | verifies the address only; the row is deleted 12 months later |
| G      | `Stav`               | dropdown | `Čeká na přijetí`, `Přijato`, `Nepřijato`; says what was decided, not where the person is today |
| H      | `Role`               | dropdown | from the `Role` sheet, chosen before `Přijato`               |
| I      | `Zápis do Kontaktů`  | date     | filled in by the script once the person is on `Kontakty`     |

Behaviour:

- Conditional formatting reads `Stav` and colours each named row of `Kontakty`, pastel green for
  `V redakci` and pastel red otherwise. (Any such rule combines
  its conditions with `*` rather than `AND(…,…)` and has no `TRUE`/`FALSE`: `whenFormulaSatisfied`
  doesn't localise the separator, so a comma breaks the rule in a Czech-locale sheet.)
- `Přijato` on `Přihlášky`, with a `Role` chosen first, writes the person to `Kontakty` through the same
  trigger: a new row at the first empty name, or their existing row, found by any address in its `E-mail`
  cell. Either way they end up `V redakci`, with the role added, today's `Poslední potvrzení` and empty
  `Odchod či vyřazení` and `Dotaz odeslán`. `Zápis do Kontaktů` then keeps a retry or a fill-down from adding
  anyone twice, and nobody gets an e-mail. No role, another name on the address or a failure refuses the
  row: `Stav` goes back and a note on the cell says why. A fill-down has no old values, so its refused rows
  go to `Čeká na přijetí` ([log 0068](work-log/0068-acceptance-refuses-a-different-name-and-a-refused-fill-down-goes-to-pending.md)).
  `Nepřijato` moves nothing.
- `handleSpreadsheetEdit`, an installable trigger in the Membership project, acts when one `Stav` cell
  changes on a named row of `Kontakty`: it clears `Dotaz odeslán`, and for `V redakci` writes today's
  `Poslední potvrzení` and clears `Odchod či vyřazení`. A paste across rows writes no date. It moves no
  row: `Kontakty` is sorted by name only, by a nightly job and never on an edit. Section grouping and per-section
  name ordering are done in the endpoint and the app, so a member with several role chips needs no
  single sort position in the sheet.
- `runScheduledJobs`, a daily trigger in the same project between 4 and 5 a.m., deletes `Přihlášky` rows 12
  months after `Ověření e-mailu` whatever their `Stav`, sorts `Kontakty` by `Jméno` with reserve rows last and,
  on Mondays while someone is `Čeká na přijetí`, tells the chief editors' group how many wait and how long the
  longest has waited. The message names nobody, and when nobody waits nothing goes out
  ([log 0070](work-log/0070-scheduled-jobs-stamp-each-job-when-it-finishes-and-resume-on-the-next-night.md)).
- The same trigger asks whether people are still in the editorial board (#392). In September everyone
  `V redakci` whose `Poslední potvrzení` is empty or at least three months old gets an e-mail with *Jsem pořád
  v redakci* and *Odcházím z redakce*, and today's `Dotaz odeslán`. Reminders follow 4 and 8 weeks later, the
  final warning at 11, and at 12 weeks a notice with a 30-day link back, then `Vyřazení bez odpovědi`, today's
  `Odchod či vyřazení` and an empty `Dotaz odeslán`. Only rows still `V redakci` are mailed or removed; a date
  typed into `Poslední potvrzení` on or after the round's day ends the round, and people sharing an address
  under different names are never asked. The buttons lead to `/editorial-board/activity/confirm`, where opening
  the link writes nothing and the press posts `confirmActive`, `leave` or `reactivate`
  ([log 0072](work-log/0072-re-confirmation-links-are-signed-by-the-script-and-the-ladder-keeps-its-rungs-in-script-properties.md)).

The steps below are for the read, in the Contacts project.

## 4. Set the secret

In Apps Script: **Project Settings ▸ Script Properties ▸ Add script property**

- Property: `OWN_SECRET`
- Value: a long random string (e.g. `openssl rand -hex 32`)

Keep this value — it must equal the app's `GAS_EDITORIAL_BOARD_SECRET`. **Never commit
it.** Next to it, `SPREADSHEET_ID` holds the id of the spreadsheet.

## 5. Deploy the web app

**Deploy ▸ New deployment ▸ Web app**

- Execute as: **me** (the web's app account)
- Who has access: **Anyone**

Copy the `.../exec` URL — it becomes the app's `GAS_EDITORIAL_BOARD_URL`.

> Later code changes deploy through CI as a new version of this deployment, so the URL stays
> the same. Do **not** create a new deployment.

## 6. Configure the app

Set the two variables the app reads (locally in `.env`, in production as Fly secrets):

```shell
GAS_EDITORIAL_BOARD_URL="https://script.google.com/macros/s/…/exec"
GAS_EDITORIAL_BOARD_SECRET="…"   # must equal the script's OWN_SECRET
```

```shell
fly secrets set \
  GAS_EDITORIAL_BOARD_URL="https://script.google.com/macros/s/…/exec" \
  GAS_EDITORIAL_BOARD_SECRET="…" --app cz-vednemesicnik
```

When these are unset (local dev without a deployment), `/editorial-board` falls back gracefully
instead of crashing.

## Endpoint contract

`POST` with body `{ "secret": "…" }`:

```json
{
  "ok": true,
  "positions": [
    { "label": "název role", "order": 1, "members": ["Jana Nováková", "Petr Svoboda"] }
  ]
}
```

- `positions` are sorted by `order`; `members` are returned in sheet row order and the
  app sorts them by name with Czech ICU collation (`Intl.Collator('cs')` — Node has full
  ICU, GAS doesn't). Roles with no active members are included with an empty `members`
  array, and the page leaves them out.
- A bad secret or any internal failure returns `{ "ok": false, "error": "…" }`, and so does a sheet
  with people on it and nobody published, so the app keeps its last good snapshot. Apps Script's
  `ContentService` always answers HTTP 200, so `ok` is the only error signal.

Smoke-test the deployment. Read the secret into a shell variable so it never lands in
your shell history (a leading space also keeps the `read` line out of history in most
shells):

```shell
 read -rs SECRET   # paste the secret, press Enter
curl -sS -L -H 'Content-Type: application/json' \
  --data-binary "$(printf '{"secret":"%s"}' "$SECRET")" \
  "https://script.google.com/macros/s/…/exec"
```

`-L` follows Apps Script's redirect, and `--data-binary` already makes it a POST. Adding `-X POST`
repeats the POST on the redirect, which answers 405.
