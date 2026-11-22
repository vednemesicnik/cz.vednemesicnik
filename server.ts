// The host: one Node server in front of the apps on this machine. For now it serves only
// the React Router web app, as react-router-serve did. Run directly by Node's type stripping.

import './server/default-node-env.ts'

import * as http from 'node:http'
import { fileURLToPath } from 'node:url'
import { createRequestListener } from '@remix-run/node-fetch-server'
import type { ServerBuild } from 'react-router'

import { createHostHandler } from './server/create-host-handler.ts'
import { createWebHandler } from './server/create-web-handler.ts'
import { registerShutdown } from './server/register-shutdown.ts'

const port = Number.parseInt(process.env.PORT ?? '3000', 10)
const host = process.env.HOST

// A URL rather than a static import, so typechecking doesn't need a build.
const buildUrl = new URL('./build/server/index.js', import.meta.url)
const build = (await import(buildUrl.href)) as ServerBuild

const webHandler = createWebHandler(build, process.env.NODE_ENV)

const handler = createHostHandler({
  clientDirectory: fileURLToPath(new URL('./build/client', import.meta.url)),
  webHandler,
})

const server = http.createServer(createRequestListener(handler))

const onListen = () => console.log(`[server] http://localhost:${port}`)

if (host) server.listen(port, host, onListen)
else server.listen(port, onListen)

registerShutdown({ server })
