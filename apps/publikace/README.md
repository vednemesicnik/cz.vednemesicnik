# cz.vednemesicnik.publikace

The publishing app of Vedneměsíčník, a student magazine: one place where the editors-in-chief
create an issue, send the editorial board a link to start an article or upload artworks, see
where every article and artwork stands, and decide on replies the background scripts could not
read. It replaces the web pages of the `SCRIPT__Publication__*` Apps Script projects.

The interface is Czech, because the people using it are. The code is English.

**Status: built, not deployed.** The screens are drawn in a design canvas (see
[docs/design-project.md](docs/design-project.md)), and most of them are built: issues and their
Drive folders, the newsroom's links, artworks and consents, _Ke kontrole_, proofreading, final
versions and approvals, closing, the record and Settings. Nothing runs on Fly.io yet, and of the
five background jobs that talk to the app, three wait for their triggers and the comment digest for
its script. Issues made before the app stay on the scripts until the cutover.

## How it will work

| Who               | How they get in                                                  | What they do                                                         |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| Editors-in-chief  | Google account on the domain, named in Settings or in its groups | create and close issues, send links, hand texts over, review replies |
| Proofreaders      | Google account, the address in Settings › Korektura or its group | take a text, mark its final version, on the page Korektura only      |
| Editorial board   | a shared link, no sign-in                                        | start an article in one issue                                        |
| Authors           | the welcome e-mail: the Doc's link and the artworks link         | write in the Doc, consent to the final version by e-mail             |
| Artwork providers | a shared link, no sign-in                                        | upload artworks to one article and consent by e-mail                 |

- **Remix 3 on Fly.io**: Node 26 and SQLite, behind the front server of the magazine's web.
- **The app's database is the source of truth.** Issues, articles, consents and artworks live
  there. Drive keeps the files, Gmail keeps the consent conversations.
- **The Registr and Evidence sheets stay as a record.** The app writes them after every change
  and never reads them; they are where a licence is looked up.
- **The background jobs stay in Apps Script**, run as `publikace.app@` and read and write through
  the app's API. `publikace@` is only the mailbox that sends and reads the e-mails.
- **Writing and consent stay where they are**: in the Google Doc of the article and in an e-mail
  reply „Souhlasím“. The Doc carries only the text, so handing it over, proofreading and marking
  its final version happen in the app.

The written design: [product](docs/product.md), [architecture](docs/architecture.md),
[security](docs/security.md) and the [review of 24 Nov 2026](docs/review-2026-11-24.md), which
lists where design, product and code still disagree.

## Requirements

- **Node 26 or newer.**
- **pnpm 12.** The lockfile and the `packageManager` field expect it.

```sh
pnpm install
pnpm app:dev            # http://localhost:44100
pnpm app:fake           # a fake Drive and Mailer, no Google: http://127.0.0.1:44110/_fake
pnpm typecheck
pnpm test
pnpm app:doctor
pnpm lint
pnpm format:check
pnpm dev:setup-claude   # optional: skills and CLAUDE.md for Claude Code
```

The app needs no `.env` to start: the database defaults to `./db/publikace.sqlite` and is
created and migrated on the first run. [.env.example](.env.example) lists every variable the
app will read.

## Working here

[AGENTS.md](AGENTS.md) is the guide for people and agents alike: the workflow skills, the rules,
the house style and the data rules. [docs/branching-model.md](docs/branching-model.md) covers
branches, merge methods, versions and releases: work goes to `dev` by squash, `dev` goes to
`main` by a merge commit, and every merge into `main` is tagged with a version — `0.x` until
the app runs on Fly.io, published on GitHub Releases from `v1.0.0`.

## License

MIT, see [LICENSE](LICENSE).
