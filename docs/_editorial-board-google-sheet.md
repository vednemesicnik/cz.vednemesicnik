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
| [`SCRIPT__Editorial_Board__Membership`](https://github.com/vednemesicnik/SCRIPT__Editorial_Board__Membership) | The only project that writes: the setup and the edit trigger. |

Their READMEs have the steps for each project. [Apps Script web apps](_apps-script-web-apps.md)
shows where both sit among the scripts the web uses.

> **Note:** the spreadsheet doubles as the internal contact directory (e-mail, phone,
> notes). The endpoint **never** reads those columns — it returns only names and role
> labels of members whose `Aktivní` box is checked.

## 1. The spreadsheet

There is one, **"Vedneměsíčník — Redakce"**, shared as Editor with the web's app account. It
recovers from its version history, so nothing builds a new one from scratch.

## 2. The setup script

In the Membership project, select `setupSpreadsheet` and **Run**. It is made for the populated
sheet and is idempotent: it appends missing headers, deletes nothing, leaves the values in `Aktivní`
and `Role` alone and fails when the number of ticked members changes. It requires `Kontakty` and
`Role` to exist. Name a version in the spreadsheet's history before its first run.

It adds the lifecycle columns to `Kontakty`, stretches the row colours over them, creates
`Přihlášky`, and on the first run gives each named row a `Stav`.

### Manual settings the script can't do

The Sheets API exposes neither setting ([googleapis #2676](https://github.com/googleapis/google-api-python-client/issues/2676)),
so they are set in the UI on the `Role` column of `Kontakty` — **Data ▸ Data validation ▸** the
rule — and the script never applies that rule again, which would drop them:

- **Multi-select** — switch the dropdown **Display style** to **Chip**, then enable
  **Allow multiple selections**. The toggle stays greyed out until the dropdown is
  chip-style. A member can then hold several roles and appears in each section on the web.
- **Chip colors** — pick a color per role option in the same dropdown editor.

## 3. Reference: sheet design

Column headers are in Czech — the editors are the audience — and both projects locate columns
**by header label**, so they may be reordered (within each sheet) without breaking anything. The
letters below are the order on the sheet in use. The labels, values and notes went through the
copywriter; they live in the Membership project's `config.gs`.

**`Role` sheet** (protected — owner-only edits):

| Column | Header             | Example                     | Notes                                  |
| ------ | ------------------ | --------------------------- | -------------------------------------- |
| A      | `Role`             | název role v jednotném čísle | value shown in the `Kontakty` dropdown |
| B      | `Označení na webu` | název role v množném čísle    | section heading rendered on the web    |
| C      | `Pořadí`           | 1                           | sorts the sections on the web          |

**`Kontakty` sheet**:

| Column | Header         | Type              | Notes                                                        |
| ------ | -------------- | ----------------- | ------------------------------------------------------------ |
| A      | `Jméno`        | text              | member's full name                                           |
| B      | `Role`         | dropdown (chips)  | validated against `Role!A2:A`, rejects unknown values        |
| C      | `Aktivní`      | checkbox          | only checked members are published on the web                |
| D      | `E-mail`       | text              | internal only — never returned by the endpoint               |
| E      | `Telefon`      | text              | internal only — never returned by the endpoint               |
| F      | `Poznámka`     | text              | internal only — never returned by the endpoint               |
| G      | `Stav`         | dropdown          | `V redakci`, `Mimo redakci`, `Vyřazení bez odpovědi`; the web goes by `Aktivní` alone |
| H      | `Poslední potvrzení` | date        | empty means none on record, not that the person did not confirm |
| I      | `Dotaz odeslán` | date             | start of the current round of the question, from #392        |
| J      | `Odchod či vyřazení` | date        | not filled when somebody unticks by hand                     |
| K      | `Odeslání formuláře` | date        | copied from the application on acceptance, #928              |

An unticked `Aktivní` means the person is not part of the editorial board right now: they left,
stopped contributing or are on a pause. `Stav` claims no reason.

**`Přihlášky` sheet**: applications until the chief editors decide, apart from the directory of
people who are in the editorial board. Rows start to arrive with #390, and accepting moves the person
to `Kontakty` with #928.

| Column | Header               | Type     | Notes                                                        |
| ------ | -------------------- | -------- | ------------------------------------------------------------ |
| A      | `Jméno`              | text     |                                                              |
| B      | `E-mail`             | text     |                                                              |
| C      | `Telefon`            | text     |                                                              |
| D      | `Zájem o činnost`    | text     | optional answer from the form; moves to `Poznámka` on acceptance |
| E      | `Odeslání formuláře` | date     |                                                              |
| F      | `Ověření e-mailu`    | date     | verifies the address only; the row is deleted 12 months later |
| G      | `Stav`               | dropdown | `Čeká na přijetí`, `Přijato`, `Nepřijato`; says what was decided, not where the person is today |
| H      | `Role`               | dropdown | from the `Role` sheet, chosen before `Přijato`               |
| I      | `Zápis do Kontaktů`  | date     | filled in by the script once the person is on `Kontakty`     |

Behaviour:

- Conditional formatting colour-codes each named row of `Kontakty` by state — pastel green when
  active, pastel red when inactive — with a solid green/red fill on the `Aktivní` cell. (Any such
  rule combines its conditions with `*` rather than `AND(…,…)` and has no `TRUE`/`FALSE`:
  `whenFormulaSatisfied` doesn't localise the separator, so a comma breaks the rule in a
  Czech-locale sheet.)
- `handleSpreadsheetEdit`, an installable trigger in the Membership project, acts on an edit of
  `Aktivní`, `Jméno` or `Stav` on `Kontakty`. A ticked named row whose `Stav` is not `V redakci` gets
  `V redakci`; an unticked one with `V redakci` gets `Mimo redakci`. When the edit touches `Aktivní` or
  `Jméno`, a row that has just become `V redakci` also gets today's `Poslední potvrzení`; when it
  touches `Aktivní`, the rows are sorted by `Aktivní` and `Jméno`. So a `Stav` changed by hand on a
  ticked row goes back with no date. Section grouping and per-section name ordering are done in the
  endpoint and the app, so a member with several role chips needs no single sort position in the
  sheet.

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
- A bad secret or any internal failure returns `{ "ok": false, "error": "…" }`. Apps Script's
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
