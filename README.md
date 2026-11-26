# cz.vednemesicnik

📖 See the [Remix docs](https://remix.run/docs) and the [Remix Vite docs](https://remix.run/docs/en/main/guides/vite) for details on supported features.

## Layout

A pnpm workspace. The root is the host server (`server.ts`, `server/`) that serves every
application on the Fly machine, with the Docker, Fly and CI setup. The web, a React Router app,
lives in [`apps/web`](./apps/web), and Publikace, a Remix 3 app, in
[`apps/publikace`](./apps/publikace). The root scripts forward to them (`pnpm app:dev` for the
web, `pnpm publikace:app:dev` for Publikace), so the commands below run from the root.

## Development

The web's `.env` and local `data/` live in `apps/web`, where its dev server and Prisma run.
A checkout from before the move keeps them at the root: `mv .env data apps/web/`.


Run the Vite dev server:

```shellscript
pnpm app:dev
```

## Deployment

First, build your app for production:

```sh
pnpm app:build
```

Then run the app in production mode:

```sh
pnpm app:start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `pnpm app:build`

- `apps/web/build/server`
- `apps/web/build/client`

### Project Documentation

The deployment and the repository are documented in [`docs`](./docs/README.md), the web in
[`apps/web/docs`](./apps/web/docs/README.md).
