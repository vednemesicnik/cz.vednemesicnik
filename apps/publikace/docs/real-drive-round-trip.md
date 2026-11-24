# The round trip against the real Drive

The suite and `pnpm app:fake` run every Drive, Docs and Mailer call against
`app/drive/fake-drive.server.ts` and a recording mailer. Those can only promise what the code
already expects. This run sends the same calls to the real services, from a local app, on a
test shared drive, through the Mailer of `publikace@`, to testers' addresses only. It is done once locally and once more on production before
the newsroom moves off the scripts. Until both pass, the scripts and the sheets stay the real
path.

A check that fails ends in one of two places. It is a fix with a test in the module's
`*.server.test.ts` that feeds the real answer through the injected `fetch`, or, when Drive cannot
do what the code assumes, a new issue. Each result goes into a comment on the issue that asked
for the run.

## Before the run

Nothing here is real data in the repository: the IDs, the URLs and the testers' addresses live in
`.env` and in the testers' own mailboxes, never in a file that is tracked.

**The Cloud project of the OAuth client** (the one `GOOGLE_CLIENT_ID` names):

- [ ] the authorised redirect URIs include both `http://localhost:44100/sign-in/google/callback`
      and `http://localhost:44100/settings/account/callback`;
- [ ] the consent screen offers the `https://www.googleapis.com/auth/drive` scope;
- [ ] the **Google Drive API**, the **Google Docs API** and the **Google Sheets API** are
      enabled. The Docs API writes the article's name into the copied Doc
      (`documents.batchUpdate`, `replaceAllText`); the Sheets API writes the Registr and each
      Evidence (#111).

**A test Registr**, never the real one:

- [ ] a spreadsheet named `Registr (test)` with a list `Vydání` holding a header row and one
      made-up issue, as the scripts' list looks;
- [ ] shared with `publikace.app@` as an editor, a file share: the account belongs to no other
      shared drive, and the real Registr will need the same share;
- [ ] its ID is `REGISTRY_SPREADSHEET_ID`.

**A test shared drive**, never _Publikace_ or a folder the scripts use:

- [ ] `publikace.app@` is a member with the role **Content manager**, not Manager, because that
      is its role on _Publikace_ and the cleanup's bin is what is being tried;
- [ ] a folder in it holds the issues, and its ID is `ISSUES_FOLDER_ID`;
- [x] the drive allows sharing with people outside the organisation, and the issues folder is
      shared as _Každý, kdo má odkaz · Přispěvatel_. Every issue, article folder and Doc inherits it, as on
      _Redakce_: an author outside the domain edits the Doc through its link.

**The article template**, which is not on the shared drive. On a shared drive every member who can
write may change or bin it. `TEMPLATE__Publication__Article` lives in `publikace.app@`'s own _Můj
disk → Templates_, where only that account edits it and the app copies it as its owner. It is a
Doc without code:

- [ ] a copy of the template, made as `publikace.app@` with _Vytvořit kopii_ in Drive. Its body
      still contains `{{NAZEV_CLANKU}}`, _Rozšíření › Apps Script_ opens an empty project of its
      own rather than a bound one, and its ID is `ARTICLE_TEMPLATE_DOCUMENT_ID`.
- [ ] shared as _Kdokoli ve vednemesicnik.cz · Čtenář_, so that _Šablona článku_ in Nastavení ›
      Soubory na Disku opens for an editor-in-chief; `publikace.app@` stays its only editor.

**The Mailer of `publikace@`** (`SCRIPT__Mail__Send`), its existing deployment and not a new
one. `OWN_SECRET` belongs to the project, so a second deployment would share it and keep
nothing apart. What keeps the run away from real people is the recipients alone, and the Mailer
sends to nobody the request does not name:

- [ ] `GET` on its `/exec` URL answers with the JSON contract. An HTML page means the deployment
      is not _Anyone_ or the project was never authorised;
- [ ] that URL as `MAIL_SEND_URL`, and `OWN_SECRET` from the project's Script Properties as
      `MAIL_SEND_SECRET`, copied by the tester;
- [ ] every address the run types into a form is one a tester reads.

**`.env`**, edited by the tester:

- [ ] `ISSUES_FOLDER_ID` and `ARTICLE_TEMPLATE_DOCUMENT_ID` as above, `MAIL_SEND_URL` and
      `MAIL_SEND_SECRET`, and `DRIVE_TOKEN_KEY` set;
- [ ] `DRIVE_ACCOUNT_EMAIL` empty (it defaults to `publikace.app@` on `AUTHORIZED_DOMAIN`);
- [ ] `REGISTRY_SPREADSHEET_ID` the test Registr's, never the real one's.

The run's database is not a line in `.env`. It is set on the command line, because Node's
`--env-file` never overrides a variable that is already set, so the run stays apart from the dev
database without `.env` changing:

```sh
env DATABASE_PATH=./db/round-trip.sqlite pnpm app:dev
```

The server reads `.env` only when it starts, so every change to it means a restart. Sign in at
`http://localhost:44100`, and in _Nastavení_ connect the account with _Připojit účet_ as
`publikace.app@`. Settings shows it connected, and the account banner is gone.

## The run

In order: each check uses what the one before it made.

1. **An issue makes its folders.** _Nové vydání_ with a test name. The issues folder now holds a
   folder of that name, and inside it `Články` and `_Podklady_pro_tisk`. Nothing else appears
   anywhere on the drive.

   _Dokončit vydání_ adds only what is missing. Stop the app and, with `sqlite3`, run
   `UPDATE issues SET print_folder_id = NULL, completed_at = NULL WHERE name = '…'`, then start
   it again. The issue is _Nedokončené_. Do it twice:
   - with `_Podklady_pro_tisk` left in place, _Dokončit vydání_ adopts it, and no second folder
     appears. This is the look-up by name on a shared drive;
   - with `_Podklady_pro_tisk` moved to the bin in Drive first, _Dokončit vydání_ makes a new one
     beside `Články`, and the one in the bin stays there.

2. **An article makes its folder, its two folders, its Doc and `_meta.json`.** Open the
   newsroom's link from the issue's page and send the form with one or two authors on testers'
   addresses. In `Články` there is a folder named after the article holding:
   - the folders `Obrazová díla` and `Licence`, both empty;
   - the Doc, a copy of the template with the article's name where `{{NAZEV_CLANKU}}` was;
   - `_meta.json` with `docId`, `articleName`, `issue`, `articleFolderId`, `issueFolderId`,
     `sheetId` (`null`) and `authors`.

   Open the Doc. Its menu bar has no menu of the app's and nothing asks for authorization: the
   Doc carries only the text.

3. **A failed step leaves its files in the bin.** Start the app with a template ID that does not
   exist, `env DATABASE_PATH=./db/round-trip.sqlite ARTICLE_TEMPLATE_DOCUMENT_ID=1doesNotExist pnpm app:dev`,
   and send another article. The page refuses it (`20c`), the log says the Doc was not copied
   with HTTP 404, and the article has no row. The folder that attempt made is not in `Články`
   but in the shared drive's own bin: the drive's menu, _Zobrazit koš_, and not the bin in the
   sidebar, which holds only _Můj disk_. That bin loads its list as it scrolls, so a file missing
   from it is best looked up by its ID from the database, `drive.google.com/file/d/<id>/view`,
   whose page says _Soubor je v koši_. That it got there is the check that a Content manager can
   move a file to the bin. No e-mail went out. Start the app again without the override.

4. **The welcome e-mail arrives once per author.** Every author of the article in check 2 has
   one e-mail, _Článek „…“ je ve vydání …_, from `publikace@`. Then send the same form again, the
   way a retry after a lost answer does. The form is sent by `fetch` and leaves no history
   entry, so the browser's back button does not bring it back. Replay the request instead, with
   its one-time key from `SELECT form_key FROM articles`, and the same fields:

   ```sh
   curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:44100/l/<key>/article \
     --data-urlencode "formKey=<form_key>" --data-urlencode "intent=create" \
     --data-urlencode "name=<article>" \
     --data-urlencode "author-name=<name>" --data-urlencode "author-email=<address>"
   ```

   The answer is `20d` again, there is still one article, and no second e-mail arrives.

5. **Nothing the old scripts use was touched.** The Registr, every issue's Evidence sheet and the
   folders the scripts use show no change since the run began: check the _Poslední úprava_
   column in Drive and the sheets' version history.

6. **An upload goes to `Obrazová díla`.** From the article page's link to the artworks, upload
   a JPEG, a PNG, a HEIC and a TIFF. Each is in the article's `Obrazová díla`, named by its hash with its
   extension, at its full size. Every upload is resumable. Include one close to the page's limit
   of 15 MB, the size that resumable uploads are for.

7. **The licence carries its preview.** Fill in author and source for each and send with _Odeslat
   díla_. The article's `Licence` now has a PDF per artwork, `<hash>.pdf`. Open each:
   - the preview image is in it, from the artwork's thumbnail;
   - for a format Drive makes no thumbnail of, the PDF says _[Náhled není k dispozici]_, and the
     batch was still sent.

   Note which formats got a preview: HEIC and TIFF are the open question. Temporary Docs named
   `_tmp_licence_…` are all in the bin, and nothing new is in the article folder itself.

8. **The consent request arrives once, with every PDF.** The provider's address has one e-mail
   whose subject begins _Žádost o potvrzení souhlasu s užitím obrazových děl_ and ends with a
   `[tag]`. It carries one PDF per artwork. Repeat with as many artworks as the page takes, up to
   20, to see the attachments under the Mailer's 25 MB. Then replay the send with the same form
   key, as in check 4: nobody gets a second e-mail.

9. **The reply check finds the reply.** Reply _Souhlasím_ to the request from the provider's
   mailbox. Send `SCRIPT__Mail__Reply_Check` one signed `check` item. Sign it the way
   `signEnvelope()` in `app/mail/mailer.server.ts` signs the Mailer's, under the reply check's
   own secret. Its fields: `sender` is the provider's address, `subjectPrefix` is the prefix
   above, `subjectTag` is the tag without its brackets, and `expectedReply` is `souhlasím`. The
   script that signs it reads the secret from the environment, typed with `read -s`, so it
   lands on no screen and in no file. The answer is `reply_matches` with the thread, its
   `threadId`, the reply's `replyMessageId` and its `replyText`. Nothing in the app changes: the
   app learns of a reply only from the job's report, as "The reply check's API" below tries.

10. **A failed batch and the 24-hour sweep.**
    - Send a batch of five artworks or more and stop the app while it is still sending: a
      licence takes about ten seconds, so twenty seconds in, some exist and nothing is
      committed. Start it again. The licences and temporary Docs that batch made are in the bin,
      the artworks are back on their page, and nobody got an e-mail.
    - Upload two artworks and send neither. In Drive, move one of them out of `Obrazová díla`.
      Open it by its `drive_file_id`, because the same image uploaded twice gets the same name.
      Stop the app, run
      `UPDATE artworks SET uploaded_at = '2000-01-01T00:00:00.000Z' WHERE batch_id IS NULL AND removed_at IS NULL`,
      and start it: the sweep runs at startup. The one still in `Obrazová díla` is in the
      bin. The one that was moved is where it was moved to. Both have `removed_at` and leave the
      page.

11. **A folder somebody binned stays binned until a person brings it back.** Put the article's
    `Licence` in the bin from Drive.
    - Open the article's link to the artworks: the page says _Zkuste to později. Z tohoto odkazu
      teď nejde díla nahrát ani odeslat._, and a chosen file is refused on its card.
    - Open the issue's page: under the article's row stands _Obnovte složku Licence z koše…_ with
      _Zkontrolovat znovu_, and the issue counts one in _Čeká na vás_ on the overview.
    - Follow the link on _Licence_ in that sentence. Note what Drive shows for a folder in the
      bin, and whether it offers to restore it there: the link stays only if it does.
    - Restore it, then _Zkontrolovat znovu_: _Složka je zpátky na sdíleném disku Publikace._, and
      the Callout is gone. Nothing was created on Drive in between.

## Proofreaders in the app

A proofreader signs in with Google like an editor-in-chief and sees only `/proofreading` (#82).
Who is one is the address in Nastavení › Korektura, asked of the membership service as a group
in Přístup is. The suite fakes the service, so what Google and the service answer is checked
here:

- [ ] the group of proofreaders is in `allowedGroups` of `SCRIPT__Auth__Group_Membership`, as
      every group in Přístup is (row 27 of `03`). Without it Nastavení shows the Callout under the
      address and the proofreaders get `notlisted`;
- [ ] a member of the group who is not in Přístup signs in and lands on `/proofreading`, whose
      panel has the one section _Korektura_; `/issues/…` answers _Sem má přístup jen šéfredakce_;
- [ ] _Vzít si korekturu_ on an article handed over in check 1–2 shows _Korektura · od … · ‹the
      account's name›_ in the issue detail, and _Zrušit korekturu_ returns it to _Dopsáno_;
- [ ] the link _Otevřít v Publikaci_ in a digest (the section below), opened in the Gmail app on
      iOS and on Android while signed out, goes through Google's sign-in inside the Gmail window
      and lands on the article's card (row 59 of `03`). If the window refuses the sign-in, that
      is said in the issue: the proofreaders then open the link in a browser.

## The final version

_Označit finální verzi…_ on the page Korektura exports the article's Doc to PDF and stores it in
the article folder (#88). The suite exports a fake Doc on a fake Drive, so what the real Drive does
is checked here, on an article taken in the section above:

- [ ] the dialog names the article and its authors' signatures; _Označit finální verzi_ ends with
      _Finální verze je uložená._ and the card shows _K souhlasu_ with _Otevřít PDF_;
- [ ] the article folder holds one `<sha256>.pdf` whose pages are the Doc as it was, and
      _Otevřít PDF_ opens it for the proofreader, who is not a member of the shared drive;
- [ ] _Vrátit_ puts the PDF in the shared drive's bin and the article back in _Korektura_ of the
      same take, with its date;
- [ ] with the Doc in the bin, the dialog says _Dejte vědět šéfredakci._ to the proofreader and
      _Obnovte dokument z koše…_ to an editor-in-chief, and nothing is stored;
- [ ] a call to `POST /api/v1/approvals/claim` with the job's identity token, as in the section
      below, returns the clause with the PDF's ID; _Zrušit finální verzi_ then answers _Finální
      verzi už nelze zrušit._ and the PDF stays where it was.

## The reply check's API

The reply check of artworks is `SCRIPT__Publication__Artwork_Replies`, a standalone Apps Script
project under `publikace.app@` (#53). Each run claims batches (`/api/v1/artwork-replies/claim`),
asks `SCRIPT__Mail__Reply_Check` about them, files a consent's conversation as a PDF in the
article's `Licence`, and reports every batch (`/api/v1/artwork-replies/report`), all with the
job's Google identity token. The suite covers what the app does with a report, but not how Google
issues the token, how Drive takes the PDF on a shared drive, or what Gmail returns.

**First, the token.** In the project's editor, as `publikace.app@`:

- [ ] run `testConfiguration`. Its `aud` goes into `SCRIPT_TOKEN_AUDIENCE`, and it must say the
      token's e-mail is the job account, `publikace.app@vednemesicnik.cz`, the value of
      `SCRIPT_JOB_ACCOUNT`. Production does not start without either. Both Script Properties
      must show ✅.

**Then end to end.** Apps Script has to reach the app, so it runs behind a tunnel to
`http://localhost:44100` until the app is on Fly.io. Set `CONFIG.appOrigin` to the tunnel's
address in this project's editor, not in a copy: a copy is another Cloud project, and its token
carries another `aud`. The next `clasp push` puts the origin back. Each step below runs
`checkArtworkReplies` by hand. A run's report frees its batches at once, so the next run may
follow straight away; only a batch whose run never reported stays claimed for ten minutes, and a
run within that window skips it.

1. Send a consent request from an artworks page, and run the job before anybody answers. The run
   log says _Claimed 1 batch(es)_ and _Reported 1 batch(es)_, and the batch stays _U poskytovatele_.
2. Answer the e-mail from the provider's mailbox with _ok, souhlas_, and run the job. `/review`
   shows the card with the reply, the panel counts one, and the issue's page shows _Ke kontrole_
   with _odpověď „ok, souhlas“_. Nothing new is in `Licence`.
3. _Je to souhlas_, then run the job. `Licence` holds one PDF named
   `‹poskytovatel› - obrazová díla ‹sha256›.pdf`, with the whole conversation and the note
   _Odpověď poskytovatele byla ručně posouzena jako souhlas._ The issue's page shows _Schváleno_
   with _konverzace v Licencích_.
4. On a second batch, archive the thread in `publikace@`'s mailbox first, then answer exactly
   _Souhlasím_, and run the job. The reply is found though the thread is not in the inbox. The
   batch goes straight to _Schváleno_, and its PDF carries no note.
5. On a third batch, answer _Souhlasím_, run the job, and stop the app as soon as the claim has
   opened the run. The reply check and the PDF take only seconds, which is too quick for a hand,
   so start this in a shell before the run, and it stops the server the moment a new run's row
   appears. It waits for a new row rather than an open one, because a run that never reported
   stays open for good:

   ```sh
   db=db/round-trip.sqlite
   last=$(sqlite3 -readonly $db 'select coalesce(max(id), 0) from job_runs')
   until [ "$(sqlite3 -readonly $db "select count(*) from job_runs where id > $last")" -gt 0 ]; do
     sleep 0.1
   done
   kill "$(lsof -tiTCP:44100 -sTCP:LISTEN)"
   ```

   The PDF is made and the report is refused: behind the tunnel Cloudflare answers for the
   stopped app, so the log says _Report refused (bad_response, HTTP 502)_. Start the app, wait
   ten minutes, and run the job again. `Licence` holds one PDF for that batch, not two, and the
   batch is _Schváleno_.

6. On a fourth batch, answer with text under a quoted line („Souhlasím“, the quote, then „Ale bez
   třetího obrázku.“). The card quotes the whole reply, the objection included, and nothing is
   archived.
7. Call `claim` with `curl` and a made-up bearer: 401, and nothing changes.

## The article approvals

`SCRIPT__Publication__Article_Approvals`, a standalone project under `publikace.app@` (#89), sends
the final versions of issues made in the app and reads their authors' replies. Each run makes one
`/api/v1/approvals/claim`, which hands it the clauses to send and the clauses to ask about, and one
`/api/v1/approvals/report` with both. The token is checked as the reply check's is, so the same
`testConfiguration` step applies, and the run goes behind the same tunnel. The old
`SCRIPT__Publication__Approval_Send` under `publikace@` keeps sending the clauses of the issues
made before the app, from their Evidence; the two never see each other's clauses.

1. Mark the final version of an article with two authors, whose mailboxes you can read, and run
   `runApprovals` by hand. Each author gets _Žádost o potvrzení finální verze článku „‹název›“ –
   ‹vydání› [clause_…]_ from `publikace@`, with the PDF attached as `‹sha256›.pdf` and the clause
   word for word as the old job sends it. The issue's page shows _K souhlasu · souhlas 0 ze 2
   autorů_, and _Zrušit finální verzi_ is gone.
2. Run the job again at once: no second e-mail, and the run log says it claimed two replies.
3. Answer exactly _Souhlasím_ from the first author and _Souhlasím, jen prosím jiný podpis._ from
   the second, and run the job. `Licence` holds one PDF, `‹autor› - redakční doložka ‹sha256›.pdf`.
   `/review` shows the second reply as _Finální verze článku · ‹vydání›_ beside any artwork's, the
   panel counts it, and the issue's page shows _Ke kontrole · Jiná odpověď · ‹autor›_.
4. _Je to souhlas_, then run the job. `Licence` holds the second PDF with the note _Odpověď autora
   byla ručně posouzena jako souhlas._, and the issue's page shows _Schváleno · konverzace
   v Licencích_.
5. On another article, stop the app as the run opens, with the shell loop of the reply check's
   step 5. Start it again, wait ten minutes and run the job: each author has one e-mail, not two,
   because the Mailer's key is the clause's.
6. `/settings/jobs` lists _Žádosti a odpovědi u článků_ with its last run.
7. On the article of step 4, now _Schváleno_, add a comment in its Doc and open the issue's page:
   it stays _Schváleno_. Type a word in the Doc, wait a minute for Drive to save the revision and
   open the page again: _Upraveno po schválení · poslední úprava ‹dnes›_, the button _Označit
   novou verzi…_ in the row, and the open row's Callout _Text dokumentu byl po uložení PDF
   upraven_. Mark the new version and run the job: each author gets the e-mail that opens with
   _Váš předchozí souhlas se vztahuje k dřívější verzi._

## The proofreaders' digest

The morning digest is one call, `/api/v1/proofreading-digest/run`, from
`SCRIPT__Publication__Proofreading_Digest`, a standalone project under `publikace.app@` (#14).
The app builds the digest and sends it through the Mailer. The suite covers what is in it and
what is recorded; what it cannot cover is how Gmail shows the e-mail and whether a retry keeps to
one message. The job's token is checked as the reply check's is, so the same `testConfiguration`
step applies.

1. In Nastavení › Korektura, set the address to a test group whose mailbox you can read.
2. Hand over two articles in an issue's detail, then run the job once by hand from its project, or
   call the API with `curl` and the job's token. One e-mail _Ke korektuře – ‹dnešní datum›_ arrives with both
   under _Nově předané_, each button leading to `/proofreading?article=‹id›`, and the job's
   history says _Přehled odeslán. Nová předání: 2._
3. Run it again at once: no e-mail, and the history says _Bez nových nebo zrušených předání
   k oznámení._
4. Cancel one of the two and run it: one e-mail with _Zrušená předání_ and _Stále čekají na
   korekturu_.
5. Stop the Mailer's deployment or break its secret, hand over a third article and run it: the
   history says _Odeslání přehledu se nepodařilo potvrdit._, and the banner stands over every
   screen. Mend it and run again: one e-mail, and the banner goes.

## Answering a reply from Ke kontrole

The answer goes through the Mailer as a reply in the thread of the consent request (#31,
`13d`–`13h`). The Mailer's own live test tried a reply in an article's thread and every refusal;
the suite covers what the app stores and shows. What is left is what only real Gmail shows.

1. Answer an artwork provider's reply that is not „Souhlasím“, from a test address outside
   `vednemesicnik.cz`: the answer lands in the provider's thread with `Re:`, from _Publikace
   Vedneměsíčník_, with the signature, the footer and the quote of the provider's message laid out
   as `13h` draws them.
2. Answer an author's reply on a final version the same way: the thread is the final version's.
3. Reply to the answer from the provider's mailbox and let the reply check run: the card comes back
   with the new message and _Dřívější odpovědi z Publikace (1)_.
4. Stop the Mailer's deployment, answer, start it again and use _Odeslat znovu_: the provider gets
   one e-mail.

## An artwork group

A group is made in the issue detail (#133, `12e`) and uploads like an article. The suite runs it on
the fake Drive; what is left is what only the real one shows.

1. _Nová skupina_ with a name and a note: the issue folder gets `Skupiny obrazových děl`, and in
   it the group's folder with `Obrazová díla`, `Licence` and `_meta.json`, whose `kind` is
   `artwork-group` and whose `note` is the note. A second group goes into the same
   `Skupiny obrazových děl`.
2. Open the group's link from another browser: _Ke skupině ‹název›_ and the note under the title.
   Upload and send: the request's subject says _ze skupiny „‹název›“_, the licences land in the
   group's `Licence`, the artworks in its `Obrazová díla`.
3. Reply „Souhlasím“ and let the reply check run: the archived PDF lands in the group's `Licence`.
   Until `SCRIPT__Publication__Artwork_Replies` reads `kind`, its header says _Článek_.
4. The Evidence's _Obrazová díla_ has the group's rows with its name and folder within a minute.

## The record

The Registr and each Evidence follow the database through the record queue (#111), a pass every
30 s under `publikace.app@`. Nothing on a screen says how far it is; the log does.

1. Once the first issue is complete, within a minute: an `Evidence` in its folder with the lists
   _Články_, _Redakční doložky_ and _Obrazová díla_, their headers dark, their status dropdowns
   in place (_Dopsáno_ among those of _Články_), and _Otevřít Evidenci_ first in the issue's „⋯“.
2. The test Registr has a list _Vydání z aplikace_ with the issue, _Aktivní_ ticked and _ID
   tabulky_ the Evidence. The list _Vydání_ shows no new version in the version history.
3. As a tester who is not `publikace.app@`, try to type into either list: the sheet refuses. The
   log has no `[record] the protection of the list … was put back` after the first write: one
   on every write would mean Google reads a protection back otherwise than the fake does.
4. Create an article, hand it over, mark its final version and upload artworks: each shows in
   the Evidence within a minute, in the states the scripts' Evidences use.
5. Close the issue: _Aktivní_ is cleared. Reopen it: ticked again.
6. Disconnect `publikace.app@` in Nastavení, change something, connect it again: the record
   catches up within a minute, and the log has no failed write in between.
7. Take the account's share off the test Registr for a minute: the log says
   `[drive] the Registr was not written`, the actions still work, and once the share is back the
   list catches up within the hour the backoff allows.

## After the run

- [ ] put the origin back by pushing the project from CI (`workflow_dispatch` of `deploy.yml`),
      and run `setupTriggers` as `publikace.app@` only once the app answers on its public origin;
      until then every run stops at the claim;
- [ ] remove `publikace.app@` from the test shared drive: _Publikace_ is the only shared drive
      it belongs to, because it holds the full `drive` scope;
- [ ] delete the shared drive `Publikace (test)`, once its bin has been looked at;
- [ ] delete `./db/round-trip.sqlite` and the test Registr;
- [ ] write the results into the issue: each check passed, fixed in a commit, or moved to a new
      issue.
