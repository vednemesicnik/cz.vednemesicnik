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
- [ ] a folder in it holds the issues, and its ID is `ISSUES_FOLDER_ID`.

**The article template**, which is not on the shared drive. On a shared drive every member who can
write may change or bin it, its bound script included. It lives in `publikace.app@`'s own
_Můj disk → Šablony_, where only that account edits it and the app copies it as its owner:

- [ ] a copy of the template, made as `publikace.app@` with _Vytvořit kopii_ in Drive so that it
      carries its bound script. Drive says so on the copy page. Its body still contains
      `{{NAZEV_CLANKU}}`, its menu bar shows _✦ Publikace_, and its ID is
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
   lands on no screen and in no file. The answer is `reply_matches` with the thread. Nothing in
   the app changes: the app does not ask the reply check yet.

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

- [ ] set `oauthScopes` in `appsscript.json` to `openid`,
      `https://www.googleapis.com/auth/userinfo.email`, `profile` and the scopes the script uses
      already, then run a throwaway function that logs the decoded payload of
      `ScriptApp.getIdentityToken()`;
- [ ] compare `aud` between the two copies. The same value in both, and in every later copy, goes
      into `DOC_MENU_TOKEN_AUDIENCES`. Different values make it `*`, the weaker choice: the Drive
      check asks about the account, not the token, so an editor's identity token that another
      Google client received could be replayed until it expires, about an hour. Production does
      not start without one of the two;
- [ ] note whether `name` is in the payload with `profile`. Without it the app records and shows
      the address (`12a`, `12p`);
- [ ] open a `showModalDialog` whose button calls `google.script.run`, in a browser where two Google
      accounts are signed in, and note whether the call fails. That is the case the script's own
      dialog _Zkuste to za chvíli znovu_ covers.

**Who may edit an article's Doc.** Nothing in the app shares a Doc with its authors, so:

- [ ] list the permissions of an article's Doc as `publikace.app@` (`permissions.list` with
      `supportsAllDrives`), and write down how an author and a proofreader get the right to edit:
      a grant to them, a group, the domain, anyone with the link, or the shared drive's members;
- [ ] when it is a group, check that the group is in the membership service's `allowedGroups`:
      a group the service does not know leaves the app's answer a "don't know", and the menu
      shows its own dialog instead of recording.

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
   the article.
6. With the app stopped, the menu shows _Zkuste to za chvíli znovu_.

## After the run

- [ ] remove `publikace.app@` from the test shared drive: _Publikace_ is the only shared drive
      it belongs to, because it holds the full `drive` scope;
- [ ] delete the shared drive `Publikace (test)`, once its bin has been looked at;
- [ ] delete `./db/round-trip.sqlite`;
- [ ] write the results into the issue: each check passed, fixed in a commit, or moved to a new
      issue.
