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
- [ ] the **Google Drive API** and the **Google Docs API** are enabled. The Docs API writes the
      article's name into the copied Doc (`documents.batchUpdate`, `replaceAllText`).

**A test shared drive**, never _Publikace_ or a folder the scripts use:

- [ ] `publikace.app@` is a member with the role **Content manager**, not Manager, because that
      is its role on _Publikace_ and the cleanup's bin is what is being tried;
- [ ] a folder in it holds the issues, and its ID is `ISSUES_FOLDER_ID`;
- [x] the drive allows sharing with people outside the organisation, and the issues folder is
      shared as _Každý, kdo má odkaz · Přispěvatel_. Every issue, article folder and Doc inherits it, as on
      _Redakce_: an author outside the domain edits the Doc through its link, and the Doc menu
      accepts whoever may edit.

**The article template**, which is not on the shared drive. On a shared drive every member who can
write may change or bin it, its bound script included. `TEMPLATE__Publication__Article` lives in
`publikace.app@`'s own _Můj disk → Templates_, where only that account edits it and the app copies
it as its owner. Its bound project is `SCRIPT__Publication__Article_Menu`:

- [ ] a copy of the template, made as `publikace.app@` with _Vytvořit kopii_ in Drive so that it
      carries its bound script. Drive says so on the copy page. Its body still contains
      `{{NAZEV_CLANKU}}`, its menu bar shows _Publikace_, and its ID is
      `ARTICLE_TEMPLATE_DOCUMENT_ID`.

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
- [ ] `REGISTRY_SPREADSHEET_ID` empty. The app reads it nowhere yet, and the run must not reach
      the Registr even by mistake.

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

   Open the Doc. Its own menu, _✦ Publikace_, appears in the menu bar. On a fresh copy that
   can take well over half a minute, so a menu that is not there yet is not a failure. From it,
   run only
   _Zobrazit metadata článku_. It only reads `_meta.json` beside the Doc, and it lists the article,
   the issue, the folders and the authors, which proves the bound script reads what the app
   wrote. Its first run asks the tester to authorise the copy's script. **Run none of the other
   items.** The two _Označit…_ items write to an issue's Evidence sheet, and with `sheetId`
   `null` they fail before writing. _Nastavit metadata článku_ would rewrite the app's
   `_meta.json`.

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

## The article Doc's menu

_Označit probíhající korekturu_ in a Doc of an app issue calls the app's API
(`/api/v1/doc-menu/proofreading`) with the clicker's Google identity token, and the app asks
Drive whether that account may edit the Doc (#50). The suite can only assume how Google issues
the token and how Drive lists who may edit, so both are checked here.

**First, without the app.** As `publikace.app@`, make two copies of the app's template with
_Vytvořit kopii_, as the app copies it for every article. In each copy's bound script (_Rozšíření
› Apps Script_):

- [x] set `oauthScopes` in `appsscript.json` to `openid`,
      `https://www.googleapis.com/auth/userinfo.email`, `profile` and the scopes the script uses
      already, then run a throwaway function that logs the decoded payload of
      `ScriptApp.getIdentityToken()`;
- [x] compare `aud` between the two copies. The same value in both, and in every later copy, goes
      into `DOC_MENU_TOKEN_AUDIENCES`. Different values make it `*`, the weaker choice: the Drive
      check asks about the account, not the token, so an editor's identity token that another
      Google client received could be replayed until it expires, about an hour. Production does
      not start without one of the two;
- [x] note whether `name` is in the payload with `profile`. Without it the app records and shows
      the address (`12a`, `12p`);
- [x] open a `showModalDialog` whose button calls `google.script.run`, in a browser where two Google
      accounts are signed in, and note whether the call fails.

What it showed, on 20 November 2026:

- **`aud` differs between copies.** Each copy's bound script gets a default Cloud project of its
  own (_Nastavení projektu › Projekt Google Cloud Platform: Výchozí_), so its token carries that
  project's OAuth client. No value can be pinned: `DOC_MENU_TOKEN_AUDIENCES` is `*`. The token
  still proves whose account it is, so a mark always carries the clicker's own address; what
  decides whether that account may mark is the Drive check below.
- **`name` is in the payload** with `profile`, along with `given_name`, `family_name`, `picture`
  and `hd`. `email_verified` is `true`; there is no `azp`.
- **`google.script.run` fails** when the clicking account is not the browser's default one: the
  dialog opens from the menu, but the call from its button returns _K provedení dané akce je
  vyžadována autorizace_. A server call made by the menu item itself runs as the clicking
  account; one made from the dialog runs as the default account. Trying again in the same window
  fails the same way, so an answer that only says to try later does not get that person through.
  Where the default account has authorised the script, the call would run, and record, as that
  account instead of the one the confirmation named.
- **`fetch` from the dialog works** in the same browser: a dialog opened by the menu item, with
  the item's identity token written into it, reached a CORS-enabled Google endpoint from its
  sandbox origin (`https://n-…-script.googleusercontent.com`), and the token was the clicking
  account's. `google.script.host.close()` closes it.

So the dialog never calls the script's server. The menu item takes the identity token and asks
the app for the confirmation; the dialog's _Označit_ sends that same token straight to the app
with `fetch`, which is why the Doc menu's endpoints answer CORS.

**Who may edit an article's Doc.** Nothing in the app shares a Doc with its authors, so:

- [x] list the permissions of an article's Doc as `publikace.app@` (`permissions.list` with
      `supportsAllDrives`), and write down how an author and a proofreader get the right to edit:
      a grant to them, a group, the domain, anyone with the link, or the shared drive's members;
- [x] when it is a group, check that the group is in the membership service's `allowedGroups`:
      a group the service does not know leaves the app's answer a "don't know", and the menu
      shows its own dialog instead of recording.

What it showed, on 20 November 2026: an article's Doc made by the scripts on _Redakce_ is open to
**anyone with the link as an editor**, inherited from above it, besides the shared drive's members.
No script and nothing in the app shares a Doc; the link is the right to edit, for authors outside
the domain too. A Doc the app made on the test drive had only the members and the domain as
readers, because its issues folder was never opened. On the drive the app uses, the issues
folder therefore carries _Každý, kdo má odkaz · Přispěvatel_ and the drive allows sharing outside the
organisation (see the test shared drive above). With that grant the app's check answers yes
before it asks about any group, so no group is looked up.

**Then end to end.** Apps Script has to reach the app, so it runs behind a tunnel to
`http://localhost:44100` until the app is on Fly.io, with the script's `CONFIG.appOrigin` set to
the tunnel's address in the test copy only:

1. Create an article through the app and open its Doc as an account that may edit it.
   _Publikace › Označit probíhající korekturu_ asks _Označit probíhající korekturu?_ with the
   article, _VDM_… · Ke korektuře zatím nepředáno_ and _Účet pro korekturu: ‹jméno›_. _Zrušit_
   records nothing.
2. _Označit_ answers _Korektura označena_, and the issue's page shows _Korektura_ with _od ‹dnes›
   · ‹jméno›_.
3. A second click answers _Korektura už je označená_ with the same name and time.
4. _Soubor › Vytvořit kopii_ in the same folder, then the menu in the copy: _Toto je kopie
   dokumentu článku_, and _Otevřít původní_ opens the article's Doc.
5. An account that may only comment answers _Publikace váš účet nepřijala_, with nothing about
   the article. Under the issues folder every Google account with the link may edit, so this
   needs a Doc outside it, shared to that account as a commenter.
6. With the app stopped, the menu shows _Zkuste to za chvíli znovu_.

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

## After the run

- [ ] put the origin back by pushing the project from CI (`workflow_dispatch` of `deploy.yml`),
      and run `setupTriggers` as `publikace.app@` only once the app answers on its public origin;
      until then every run stops at the claim;
- [ ] remove `publikace.app@` from the test shared drive: _Publikace_ is the only shared drive
      it belongs to, because it holds the full `drive` scope;
- [ ] delete the shared drive `Publikace (test)`, once its bin has been looked at;
- [ ] delete `./db/round-trip.sqlite`;
- [ ] write the results into the issue: each check passed, fixed in a commit, or moved to a new
      issue.
