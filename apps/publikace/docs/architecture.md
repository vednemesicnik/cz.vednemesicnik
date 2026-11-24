# Architecture

How Publikace is built and how it talks to Google and to the Apps Script jobs. The rules behind
it are in [product.md](product.md) and [security.md](security.md). Where the plan and the code part
ways today: [review-2026-11-24.md](review-2026-11-24.md).

## Context

```mermaid
flowchart LR
  subgraph People
    ED["Editors-in-chief<br/>and proofreaders"]
    LK["Editorial board, authors,<br/>providers"]
    GD["Graphic designer"]
  end
  subgraph Fly["Fly.io · cz-vednemesicnik"]
    HOST["Front server<br/>routes by Host"]
    APP["Publikace<br/>Remix 3, Node 26, SQLite"]
    WEB["The magazine's web"]
  end
  subgraph Google["Google Workspace"]
    OAUTH["Google sign-in"]
    DRV["Drive, Docs, Sheets<br/>as publikace.app@"]
    GM["SCRIPT__Auth__Group_Membership"]
    MS["SCRIPT__Mail__Send<br/>publikace@"]
    RC["SCRIPT__Mail__Reply_Check<br/>publikace@"]
    JOBS["Jobs as publikace.app@<br/>Artwork_Replies, Article_Approvals,<br/>Print_Handoff, Proofreading_Digest"]
  end
  ED -- "session cookie" --> HOST
  LK -- "/l/{key}/…" --> HOST
  HOST --> APP
  HOST --> WEB
  APP --> OAUTH
  APP -- "OAuth token of publikace.app@" --> DRV
  APP -- "shared secret" --> GM
  APP -- "HMAC envelope" --> MS
  JOBS -- "Google ID token, /api/v1" --> APP
  JOBS -- "signed" --> MS
  JOBS -- "signed" --> RC
  JOBS --> DRV
  LK -- "Doc link" --> DRV
  GD -- "print folder link" --> DRV
```

## The stack and where it runs

- **Remix 3** with server rendering and a few hydrated islands, on **Node 26**: `Temporal`,
  `node:sqlite`, and TypeScript stripping with no build step.
- **SQLite** at `DATABASE_PATH`. `createPublikace` applies pending migrations from
  `db/migrations` before the app answers ([migrations.md](migrations.md)). One process on one
  machine is the whole deployment, which is what makes migrating at startup safe.
- **The design system** is copied into `app/ui/public/ds/`. Components write its `vdm-*` markup.
- **`createPublikace(environment)`** in `app/publikace.server.ts` is the whole app as
  `{ fetch, close }`. It owns no process. A misconfiguration rejects before anything is opened.
  `server.ts` is the host for working on this repository alone (port 44100).
- **Production** (#79, not running yet): one more host behind the front server of the Fly app
  `cz-vednemesicnik`, after this repository moves into that one as a package. Publikace keeps its
  own SQLite file on the machine's volume. A secret whose value differs from the web's carries a
  prefix, because one Fly app has one namespace of secrets.

## Identities

| Identity                                                    | Used for                                                              | Never used for                                                |
| ----------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| The signed-in editor or proofreader                         | proving who they are at sign-in (OAuth code flow, userinfo)           | any Drive or Gmail call                                       |
| `publikace.app@` (stored refresh token, full `drive` scope) | folders, Docs, PDFs, uploads, the bin, the Registr and every Evidence | mail; any drive other than _Publikace_ and its own _Můj disk_ |
| `publikace.app@` (as the jobs' Google ID token)             | proving to `/api/v1` that a call comes from a job                     | —                                                             |
| `publikace@` (through the Mailer and the reply check)       | every e-mail; reading the replies                                     | — the app never holds its credentials                         |
| The membership service's secret                             | asking whether an account is in a listed group                        | anything else; it answers only for listed groups              |

Only `DRIVE_ACCOUNT_EMAIL` can be connected in Nastavení (`14g`, `14h`). A disconnected account
blocks every action that creates files, and a banner over every screen says so (`14c`).

## Data model

States are not stored as enums. They are derived from timestamps such as `handed_over_at`,
`consent_verified_at` and `closed_at` (see [Lifecycles](#lifecycles)). The diagram shows the
tables that carry the product. Sessions, the access list, the proofreaders' address, the Drive
account, `job_runs` and the record queue's own tables stand beside them.

```mermaid
erDiagram
  ISSUE ||--o{ LINK : "has"
  ISSUE ||--o{ ARTICLE : "holds"
  LINK ||--o{ ARTICLE : "created"
  ARTICLE ||--|{ ARTICLE_AUTHOR : "written by"
  ARTICLE ||--o| LINK : "artworks link"
  ARTICLE ||--o{ FINAL_VERSION : "marked"
  FINAL_VERSION ||--|{ ARTICLE_CLAUSE : "one per author"
  FINAL_VERSION |o--o| FINAL_VERSION : "replaces"
  ARTICLE ||--o{ ARTWORK_BATCH : "receives"
  ISSUE ||--o{ ARTWORK_GROUP : "holds"
  ARTWORK_GROUP ||--o| LINK : "artworks link"
  ARTWORK_GROUP ||--o{ ARTWORK_BATCH : "receives"
  ARTWORK_BATCH ||--|{ ARTWORK : "sent together"
  ARTWORK_BATCH ||--o{ CONSENT_ANSWER : "answered"
  ARTICLE_CLAUSE ||--o{ CONSENT_ANSWER : "answered"
  ISSUE ||--o| PRINT_HANDOFF : "print folder"
  ARTICLE ||--o| PRINT_ARTICLE : "copied"
  ARTWORK ||--o| PRINT_ARTWORK : "copied"
  ARTWORK_GROUP ||--o| PRINT_GROUP : "copied"

  ISSUE {
    int id PK
    text name "unique regardless of case"
    text folder_id "and articles_folder_id, print_folder_id, groups_folder_id"
    instant folder_missing_at "and articles_folder_missing_at, 12j"
    instant completed_at "null while Nedokončené"
    instant closed_at
    text evidence_spreadsheet_id
  }
  LINK {
    int id PK
    text key "12 random characters"
    text kind "article or artworks"
    int article_id FK "an article's artworks link"
    int group_id FK "a group's artworks link"
    instant revoked_at
  }
  ARTWORK_GROUP {
    int id PK
    text name "unique in the issue regardless of case"
    text note "for the designer"
    text folder_id "and meta, artworks, licences"
    instant created_at "null until committed"
  }
  ARTICLE {
    int id PK
    text form_key "the attempt's key"
    text name
    text doc_id "and folder, meta, artworks, licences"
    instant created_at "null until committed"
    instant handed_over_at
    instant proofread_at "and the proofreader"
  }
  ARTICLE_AUTHOR {
    int article_id PK
    int position PK
    text name
    text email
    instant welcome_sent_at
  }
  FINAL_VERSION {
    int id PK
    text pdf_file_id
    text pdf_hash
    instant cancelled_at
    instant replaced_at
    instant doc_revised_at "Upraveno po schválení"
  }
  ARTICLE_CLAUSE {
    int id PK
    text state "pending, sent, failed"
    text clause_key "the Mailer key"
    text reply_text
    instant consent_verified_at
    instant approved_at
  }
  ARTWORK_BATCH {
    int id PK
    text provider_email
    text tag "in the request's subject"
    instant mail_sent_at "or mail_failed_at"
    instant discarded_at
    instant approved_at
  }
  ARTWORK {
    int id PK
    text drive_file_id
    text stored_name "sha256 and extension"
    text author
    text source
    text licence_file_id
  }
  CONSENT_ANSWER {
    int id PK
    text text "plain text"
    text idempotency_key
    instant sent_at
  }
  PRINT_HANDOFF {
    int issue_id PK
    text sheet_id
    instant filled_at
  }
  PRINT_ARTICLE {
    int article_id PK
    text text_file_id
  }
  PRINT_ARTWORK {
    int artwork_id PK
    text copy_file_id
  }
  PRINT_GROUP {
    int group_id PK
    text folder_id
  }
```

An artworks link, a batch and an artwork belong to exactly one article or one artwork group, which
a `CHECK` on each table holds (#133). Code that does not care which reads both as a _holder_:
the folder with `Obrazová díla` and `Licence` in it, and the name the e-mails and the record show.

## Flows

### An article from the newsroom link

```mermaid
sequenceDiagram
  actor B as Board member
  participant A as Publikace
  participant D as Drive and Docs
  participant M as Mailer (publikace@)
  B->>A: GET /l/{key}/article
  A-->>B: the form with a fresh form key (20a)
  B->>A: POST name, authors, form key
  A->>A: link valid, issue active, 30 an hour, reserve the mails under the daily cap
  A->>A: insert the attempt (article and authors, not committed)
  A->>D: article folder, Obrazová díla, Licence, copy of the template, the name into the Doc, _meta.json
  Note over A,D: each ID stored as it is created, each file tagged with the form key
  alt Drive failed midway
    A->>D: bin what this attempt made
    A-->>B: 20c, nothing created
  else every file exists
    A->>A: commit, and the article's artworks link
    A-->>B: 20d
    A->>M: one welcome e-mail per author: the Doc and the artworks link
  end
```

The same form key sent again answers with the same page and sends nothing a second time.

### Artworks and their consent

```mermaid
sequenceDiagram
  actor P as Provider
  participant A as Publikace
  participant D as Drive
  participant M as Mailer
  participant J as Artwork_Replies job
  participant R as Reply_Check
  actor E as Editor-in-chief
  P->>A: each file as it is chosen (60 an hour, 15 MB)
  A->>D: upload to the article's or the group's Obrazová díla as sha256.ext
  P->>A: Odeslat díla, author and source of each
  A->>D: a licence PDF per artwork into Licence
  A->>A: commit the batch
  A->>M: consent request with the PDFs, subject ends with [tag]
  loop every 30 minutes
    J->>A: POST /api/v1/artwork-replies/claim
    A-->>J: batches waiting for a reply
    J->>R: is there a reply to [tag] from the provider?
    R-->>J: reply text and thread
    J->>J: exactly „Souhlasím“: archive the conversation into Licence
    J->>A: POST …/report
  end
  A->>A: archived: Schváleno, any other reply: Ke kontrole
  E->>A: Je to souhlas, or an answer in the thread (13)
```

### Proofreading, the final version and the authors' consent

```mermaid
sequenceDiagram
  actor E as Editor-in-chief
  actor K as Proofreader
  participant A as Publikace
  participant D as Drive
  participant G as Proofreading_Digest job
  participant J as Article_Approvals job
  participant M as Mailer
  E->>A: Předat ke korektuře (12k)
  G->>A: POST /api/v1/proofreading-digest/run, 7:00–8:00
  A->>M: one digest to the proofreaders' address (12n)
  K->>A: Vzít si korekturu on /proofreading (15d)
  K->>A: Označit finální verzi (15f)
  A->>D: export the Doc as a PDF into the article folder
  A->>A: final version and one pending clause per author
  J->>A: POST /api/v1/approvals/claim
  A-->>J: clauses to send, clauses to read the reply of
  J->>M: the final version to each author (20f)
  J->>A: POST …/report, sent or failed per clause
  Note over J,A: later runs read the replies through Reply_Check and archive „Souhlasím“
  A->>A: all authors archived: Schváleno
  E->>A: opens the issue detail
  A->>D: a revision of the Doc after the PDF?
  A->>A: yes: Upraveno po schválení, Označit novou verzi (12q)
```

### The record

```mermaid
flowchart LR
  W["Any write to an issue, article,<br/>clause, group or batch"] --> T["SQLite trigger marks<br/>the Registr or the Evidence"]
  T --> Q["Record queue<br/>every 30 s, 20 marks a pass"]
  N["Nightly: everything marked<br/>24 h after the last full pass"] --> Q
  Q -- "rewrite the whole list" --> S["Registr: list Vydání z aplikace<br/>Evidence: Články, Redakční doložky,<br/>Obrazová díla"]
  Q -- "sheet did not answer" --> B["back off 2, 4, 8… up to 60 min,<br/>log [drive] … was not written"]
```

The app writes the record after the database, never inside an action. A sheet that does not
answer delays the record and blocks nothing. The app writes only its own list, puts its
protection back before every write, and never reads a sheet. A column the record begins to
show needs its trigger changed in a new migration. A group's artworks are rows of _Obrazová díla_
with the group's name in _Název článku_ and its folder in _ID složky_, as the scripts write them,
and the Registr's _URL – Vytvořit skupinu obrazových děl_ stays empty: the app hands out no link
that creates groups (`03` row 6).

## Lifecycles

| Thing          | Derived from                                                                                          | In `app/domain/`   |
| -------------- | ----------------------------------------------------------------------------------------------------- | ------------------ |
| Issue          | `completed_at` (Nedokončené without it), `closed_at`                                                  | `issue.ts`         |
| Article        | handover and take columns; with a final version standing, the counts of its clauses; `doc_revised_at` | `article.ts`       |
| Clause         | stored `pending/sent/failed`, then the reply, `consent_verified_at`, `approved_at`, archive failure   | `approvals.ts`     |
| Artwork batch  | `mail_sent_at` or `mail_failed_at`, the reply, `consent_verified_at`, `approved_at`, `discarded_at`   | `artwork.ts`       |
| Artwork upload | no `batch_id` while unsent; `removed_at`; binned 24 h after upload if still unsent                    | `artwork.ts`       |
| Artwork group  | `created_at`; no state of its own, never deleted                                                      | `artwork-group.ts` |
| Link           | valid; gone once revoked or its issue closed; a key never issued draws the same page                  | `link.ts`          |

## Background work

**In the app's process**

| Work                  | When                                                           | Does                                                            |
| --------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Record queue          | every 30 s, and everything again 24 h after the last full pass | writes the Registr and each Evidence from the database          |
| Cleanup after a crash | at startup and at the next send through the same path          | bins uncommitted article and group attempts and artwork batches |
| Unsent uploads        | at startup and on every upload                                 | bins uploads that waited 24 hours unsent                        |

**Apps Script jobs that talk to the app**, all as `publikace.app@` on their own triggers:

| Job                                        | Interval         | API                                 | Exists                      |
| ------------------------------------------ | ---------------- | ----------------------------------- | --------------------------- |
| `SCRIPT__Publication__Artwork_Replies`     | 30 min           | `artwork-replies/claim`, `…/report` | yes                         |
| `SCRIPT__Publication__Article_Approvals`   | 30 min           | `approvals/claim`, `…/report`       | locally, not deployed (#96) |
| `SCRIPT__Publication__Print_Handoff`       | 6 h              | `print-handoff/claim`, `…/report`   | no (#119)                   |
| `SCRIPT__Publication__Proofreading_Digest` | daily, 7:00–8:00 | `proofreading-digest/run`           | no (#86)                    |

Every claim opens a run in `job_runs` and leases what it returns for 10 minutes. A report must
carry the run's key. Every e-mail carries a Mailer idempotency key, so a run that dies between
sending and reporting does not send twice. `/settings/jobs` shows each job's last run (`14d`).
Once two runs in a row fail or overdue, a banner appears over every editor's screen; for the
digest, one run is enough (`14i`).

**The API is a contract with the scripts.** It is versioned (`/api/v1`), and a field is never
renamed in place. A change to what an endpoint takes or returns is a change in the script too.
Artwork groups were added that way (#133): `artwork-replies/claim` gives each batch a `kind`
(`article` or `artwork-group`) beside `articleName`, which carries the group's name for a group,
and `print-handoff/claim` gives each issue its `groups` with their notes, which `…/report` takes
back the same way and a job written before groups leaves out.

## Configuration

[.env.example](../.env.example) documents every variable by name and purpose. In production,
`createPublikace` refuses to start when any of them is missing. There is one exception:
`REGISTRY_SPREADSHEET_ID` is optional until the cutover, and without it the app writes only the
Evidence.

| Group            | Variables                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sign-in          | `APP_ORIGIN`, `AUTHORIZED_DOMAIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `INITIAL_ADMIN_EMAIL`  |
| Group membership | `GAS_GROUP_MEMBERSHIP_URL`, `GAS_GROUP_MEMBERSHIP_SECRET`                                                               |
| Drive            | `DRIVE_ACCOUNT_EMAIL`, `DRIVE_TOKEN_KEY`, `ISSUES_FOLDER_ID`, `ARTICLE_TEMPLATE_DOCUMENT_ID`, `REGISTRY_SPREADSHEET_ID` |
| Mail             | `MAIL_SEND_URL`, `MAIL_SEND_SECRET`, `PUBLIC_MAIL_PER_DAY`                                                              |
| Jobs             | `SCRIPT_TOKEN_AUDIENCE`, `SCRIPT_JOB_ACCOUNT`, `SCRIPT_RUN_SECRET` (not read yet, see the review)                       |
| Storage          | `DATABASE_PATH`                                                                                                         |

## Testing without Google

`pnpm app:fake` runs the app on fakes of Drive, the Mailer, the membership service and the jobs,
bound to `127.0.0.1:44110`, with `/_fake` for switching their answers. The suite uses the same
fakes. What only the real services can show is tried by hand, as
[real-drive-round-trip.md](real-drive-round-trip.md) lays out.
