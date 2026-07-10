# Editorial board from a Google Sheet

The editorial board (redakce) shown on `/redakce` is moving to a **private Google
Sheet** as its source of truth, replacing the database. The chief editors edit the
sheet directly — no administration sign-in — and the app reads the public subset
(names + role labels of active members) through a **Google Apps Script web app
protected by a shared secret**. This is the same pattern as the magic-link email
(`SCRIPT__Auth__Magic_Link`): no Google Cloud project, no service account, the sheet
stays private.

> **Status:** this describes the setup once wired up. The `/redakce` loader still
> reads from the database today; it switches to the endpoint in a later step
> ([#198](https://github.com/vednemesicnik/cz.vednemesicnik/issues/198)), and the DB
> models are removed after that ([#199](https://github.com/vednemesicnik/cz.vednemesicnik/issues/199)).

The script that powers the endpoint lives in its own **private** repo,
[`vednemesicnik/SCRIPT__Editorial_Board__Contacts`](https://github.com/vednemesicnik/SCRIPT__Editorial_Board__Contacts)
(`Config.gs`, `Api.gs`, `Sort.gs`, `Setup.gs`) — the link 404s without access. This
guide is the one-time setup for the spreadsheet and its bound script.

> **Note:** the spreadsheet doubles as the internal contact directory (e-mail, phone,
> notes). The endpoint **never** reads those columns — it returns only names and role
> labels of members whose `Aktivní` box is checked.

## 1. Create the spreadsheet

Create a spreadsheet named **"Vedneměsíčník — Redakce"** in the redakce's Google
account (the account that will own the deployment). It needs two sheets, `Role` and
`Kontakty` — the setup script below creates and formats them for you, so you don't
have to add them by hand.

## 2. Add and run the setup script (recommended)

1. In the spreadsheet: **Extensions ▸ Apps Script**.
2. Create four script files and paste in the contents of `Config.gs`, `Api.gs`,
   `Sort.gs`, and `Setup.gs` from the
   [script repo](https://github.com/vednemesicnik/SCRIPT__Editorial_Board__Contacts).
3. Select the `setupSpreadsheet` function and **Run**. Authorize when prompted (the
   script edits this spreadsheet).

`setupSpreadsheet()` builds the whole structure: both sheets with the canonical
headers, frozen and formatted header rows, the `Role` dropdown on `Kontakty`, the
`Aktivní` checkbox column, conditional formatting that greys out inactive members, the
hidden `_pořadí role` sort helper, protection on the `Role` sheet, and it removes the
leftover default sheet and any excess columns. It is safe to re-run and never deletes
member rows.

### Two manual steps the script can't do

Apps Script has no API for either, so do these once in the UI on `Kontakty!B` (`Role`):

- **Multi-select** — open the column's data-validation settings and enable multiple
  selections, so a member can hold several roles (they then appear in each section on
  the web).
- **Chip colors** — open the dropdown editor and pick a color per role option.

## 3. Reference: sheet design

The setup script produces exactly this. Column headers are in Czech — the editors are
the audience — and the app locates columns **by header label**, so they may be
reordered (within each sheet) without breaking the endpoint.

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
| G      | `_pořadí role` | hidden formula    | `=IFERROR(VLOOKUP(…;Role!A:C;3;0);999)` — sort helper        |

Behaviour built by the script:

- Conditional formatting greys a row when it has a name but `Aktivní` is unchecked, so
  inactive members visually sink.
- `Sort.gs` (`onEdit`) re-sorts on any `Role`/`Aktivní` change: active first, then role
  order (the hidden helper), then name.

## 4. Set the shared secret

In Apps Script: **Project Settings ▸ Script Properties ▸ Add script property**

- Property: `SHARED_SECRET`
- Value: a long random string (e.g. `openssl rand -hex 32`)

Keep this value — it must equal the app's `GAS_EDITORIAL_BOARD_SECRET`. **Never commit
it.**

## 5. Deploy the web app

**Deploy ▸ New deployment ▸ Web app**

- Execute as: **the spreadsheet owner** (the redakce account)
- Who has access: **Anyone**

Copy the `.../exec` URL — it becomes the app's `GAS_EDITORIAL_BOARD_URL`.

> On later code changes, **edit the existing deployment** (Manage deployments ▸ edit ▸
> New version) so the URL stays the same. Do **not** create a new deployment.

## 6. Configure the app

Set the two variables the app reads (locally in `.env`, in production as Fly secrets):

```shell
GAS_EDITORIAL_BOARD_URL="https://script.google.com/macros/s/…/exec"
GAS_EDITORIAL_BOARD_SECRET="…"   # must equal the script's SHARED_SECRET
```

```shell
fly secrets set \
  GAS_EDITORIAL_BOARD_URL="https://script.google.com/macros/s/…/exec" \
  GAS_EDITORIAL_BOARD_SECRET="…" --app cz-vednemesicnik
```

When these are unset (local dev without a deployment), `/redakce` falls back gracefully
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

- `positions` are sorted by `order`; roles with no active members are included with an
  empty `members` array (the page renders "..." for them).
- A bad secret or any internal failure returns `{ "ok": false }`. Apps Script's
  `ContentService` always answers HTTP 200, so `ok` is the only error signal.

Smoke-test the deployment. Read the secret into a shell variable so it never lands in
your shell history (a leading space also keeps the `read` line out of history in most
shells):

```shell
 read -rs SECRET   # paste the secret, press Enter
curl -sS -X POST -H 'Content-Type: application/json' \
  --data-binary "$(printf '{"secret":"%s"}' "$SECRET")" \
  "https://script.google.com/macros/s/…/exec"
```
