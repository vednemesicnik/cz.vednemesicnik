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

- **Remix 3 on Cloudflare Workers.**
- **Google Drive stays the source of truth.** The Registr and each issue's Evidence are where the
  background scripts read and write; the app keeps a cache and writes changes to the sheets.
- **Writing, proofreading and consent stay where they are**: in the Google Doc of the article
  and in an e-mail reply „Souhlasím“.

## Requirements

- **Node 26 or newer.**
- **pnpm 11.** The lockfile and the `packageManager` field expect it.

```sh
pnpm install
pnpm dev:setup-claude   # optional: skills and CLAUDE.md for Claude Code
pnpm lint
pnpm format:check
```

## Working here

[AGENTS.md](AGENTS.md) is the guide for people and agents alike: the workflow skills, the rules,
the house style and the data rules. [docs/branching-model.md](docs/branching-model.md) covers
branches, merge methods and releases: work goes to `dev` by squash, `dev` goes to `main` by a
merge commit.

## License

MIT, see [LICENSE](LICENSE).
