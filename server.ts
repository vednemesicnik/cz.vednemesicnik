// The host: one Node server in front of the apps on this machine, the React Router web app
// in apps/web and Publikace in apps/publikace, each by its hosts. Run directly by Node's type
// stripping.

import './server/default-node-env.ts'

import * as http from 'node:http'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequestListener } from '@remix-run/node-fetch-server'
import type { ServerBuild } from 'react-router'

import { createHostHandler } from './server/create-host-handler.ts'
import { createWebHandler } from './server/create-web-handler.ts'
import { publikaceEnvironment } from './server/publikace-environment.ts'
import { registerShutdown } from './server/register-shutdown.ts'
import { createPublikaceErrorReporter } from './server/report-publikace-error.ts'
import {
  type CreatePublikace,
  startPublikace,
} from './server/start-publikace.ts'

const port = Number.parseInt(process.env.PORT ?? '3000', 10)
const host = process.env.HOST

// The web reads the documents committed with it from DOCUMENTS_PATH, or from its working
// directory, which is apps/web only in development. This process runs from the root.
process.env.DOCUMENTS_PATH ??= fileURLToPath(
  new URL('./apps/web/documents', import.meta.url),
)

// A URL rather than a static import, so typechecking doesn't need a build.
const buildUrl = new URL('./apps/web/build/server/index.js', import.meta.url)
const build = (await import(buildUrl.href)) as ServerBuild

const webHandler = createWebHandler(build, process.env.NODE_ENV)

// Publikace's sources carry JSX, which Node's type stripping can't run. Its own loader from
// its own dependencies transforms only the module graph it loads, so the root needs no
// `remix` and nothing else in the process is transformed.
const loadCreatePublikace = async () => {
  const publikaceRequire = createRequire(
    new URL('./apps/publikace/package.json', import.meta.url),
  )
  const { loadModule } = (await import(
    pathToFileURL(publikaceRequire.resolve('remix/node-tsx/load-module')).href
  )) as { loadModule: (specifier: string, parent: URL) => Promise<unknown> }
  const publikaceModule = (await loadModule(
    fileURLToPath(
      new URL('./apps/publikace/app/publikace.server.ts', import.meta.url),
    ),
    new URL(import.meta.url),
  )) as { createPublikace: CreatePublikace }

  return publikaceModule.createPublikace
}

// Started now and awaited by Publikace's requests only: its start runs on later ticks, so the
// port below opens for the web first.
const publikace = startPublikace({
  environment: publikaceEnvironment(process.env),
  load: loadCreatePublikace,
  reportError: createPublikaceErrorReporter({
    commit: process.env.PUBLIKACE_COMMIT,
    version: process.env.PUBLIKACE_VERSION,
  }),
})

const handler = createHostHandler({
  clientDirectory: fileURLToPath(
    new URL('./apps/web/build/client', import.meta.url),
  ),
  publikaceHandler: publikace.fetch,
  webHandler,
})

// The Fly proxy speaks plain HTTP to the machine, but the browser's Origin is the public
// one. Taking the protocol from BASE_URL (checked by the build import above) lets React
// Router's action origin check match without trusting X-Forwarded-* headers.
const protocol = new URL(String(process.env.BASE_URL)).protocol

const server = http.createServer(createRequestListener(handler, { protocol }))

const onListen = () => console.log(`[server] http://localhost:${port}`)

if (host) server.listen(port, host, onListen)
else server.listen(port, onListen)

registerShutdown({ onShutdown: publikace.close, server })
