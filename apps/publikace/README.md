# cz.vednemesicnik.publikace

The publishing app of Vedneměsíčník, a student magazine: one place where the editors-in-chief
create an issue, send the editorial board a link to start an article or upload artworks, see
where every article and artwork stands, and decide on replies the background scripts could not
read. It replaces the web pages of the `SCRIPT__Publication__*` Apps Script projects.

The interface is Czech, because the people using it are. The code is English.

**Status: design.** The screens are drawn in a design canvas (see
[docs/design-project.md](docs/design-project.md)); there is no application code yet.

## How it will work

| Who               | How they get in                               | What they do                                                        |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Editors-in-chief  | Google account on the domain, on an allowlist | create and close issues, send links, artwork groups, review replies |
| Editorial board   | a shared link, no sign-in                     | start an article in one issue                                       |
| Artwork providers | a shared link, no sign-in                     | upload artworks to one article or group                             |

- **Remix 3 on Fly.io**, the same stack as Fakturace: Node 26 and SQLite.
- **The app's database is the source of truth.** Issues, articles, consents and artworks live
  there. Drive keeps the files, Gmail keeps the consent conversations.
- **The Registr and Evidence sheets stay as a record.** The app writes them after every change
  and never reads them; they are where a licence is looked up.
- **The background jobs stay in Apps Script**, run as `publikace.app@` and read and write through
  the app's API. `publikace@` is only the mailbox that sends and reads the e-mails.
- **Writing, proofreading and consent stay where they are**: in the Google Doc of the article
  and in an e-mail reply „Souhlasím“.

## Requirements

- **Node 26 or newer.**
- **pnpm 12.** The lockfile and the `packageManager` field expect it.

```sh
pnpm install
pnpm dev:setup-claude   # optional: skills and CLAUDE.md for Claude Code
pnpm lint
pnpm format:check
```

## Working here

[AGENTS.md](AGENTS.md) is the guide for people and agents alike: the workflow skills, the rules,
the house style and the data rules. [docs/branching-model.md](docs/branching-model.md) covers
branches, merge methods, versions and releases: work goes to `dev` by squash, `dev` goes to
`main` by a merge commit, and every merge into `main` is tagged with a version — `0.x` until
the app runs on Fly.io, published on GitHub Releases from `v1.0.0`.

## License

MIT, see [LICENSE](LICENSE).
