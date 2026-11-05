# 0071. Under the publication account, only the Mailer sends and only one script reads

- Date: 2026-11-05
- Issues: #959

## Context

Four scripts under `publikace@` sent with `GmailApp`: `Article_Create`, `Approval_Send`,
`Artwork_Upload` and `Comment_Digest`. `GmailApp` needs `https://mail.google.com/`, which covers
reading, sending and deleting, and two of the four are web apps open to anyone with a link.
`Approval_Send` and `Artwork_Upload` also read consent replies, with the same parsing copied in both.

Their READMEs said sending and reading must happen in one mailbox. That rules out a Mailer under
another account, not one under `publikace@`, so log 0037's "only the Mailer sends" could apply here
too.

## Outcome

- **`SCRIPT__Mail__Send` gets a `publikace@` deployment**, and the four scripts send through it with
  `Toolkit.sendMail`.
- **`SCRIPT__Mail__Reply_Check` is the only script that reads the mailbox.** It is a stateless, signed
  web app holding only `gmail.readonly`, deployed per mailbox. A caller asks about a batch of items
  through `Toolkit.checkMailReplies` and gets a state, the thread link and the messages for each.
- **Reply parsing lives in the service.** The expected word and the archived PDF stay with the callers,
  because the service holds no Drive scope.
- **A failure is not "no reply".** A failed check leaves every row as it is, and a failed send still
  marks the row as an error.
- **The four manifests list `oauthScopes` without `https://mail.google.com/`**, so the removal can be
  read in the project's overview.
- **Properties are named after the service:** `MAIL_SEND_*` and `MAIL_REPLY_CHECK_*`.

## What follows

- A leaked Reply_Check secret exposes only conversations with the configured subject prefixes and
  known senders, and can neither send nor delete. The sender must be a plain address, and a thread's
  first subject must start with the prefix in code, because Gmail's `subject:` matches words.
- The Mailer's `maxAttachments` is 20, up from 10, because `Artwork_Upload` allows 20 artworks with one
  licence PDF each. The 25 MB cap stays.
- The Gmail API refuses `Threads.get` after about 50 calls a minute, which `GmailApp` never did. The
  service checks items in random order, so replied rows left open cannot use up the limit ahead of the
  rows below them. Items past the limit answer `failed` and retry on the next run.
- A new scope is granted before the push: a temporary function in the editor, then the consent. Triggers
  run the pushed code at once, and a web app binds its grant to the version.
- The other running scripts still use `MAILER_*` and `sendViaMailer`. They move one at a time, with the
  web app answers `mail_send_failed` and `mailError`, the app accepting both names first and
  `SCRIPT__Auth__Magic_Link` last. `sendViaMailer` goes after that.
- The scripts and their accounts are in [`_apps-script-web-apps.md`](../_apps-script-web-apps.md).

## Turned down

- **Reading with `GmailApp` in the new service.** Google lists only `https://mail.google.com/` for
  `GmailApp.search`, so the service would still hold full mailbox access.
- **A service that watches registered keys.** It would need its own state and trigger. It answers when
  asked instead.
- **One call per open row.** It would spend the six-minute run limit, so a request is a batch of up to
  100 items.
- **Leaving `Comment_Digest` as it was.** It is not public, but it would keep a second project that can
  read the mailbox.
