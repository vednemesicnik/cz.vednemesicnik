import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'

import { createPublikace } from './app/publikace.server.ts'

/*
 * The app on its own, for working on this repository: `pnpm app:dev` and `pnpm app:start`. A host
 * that serves it beside other sites calls `createPublikace` itself, with variables of its own.
 */

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 44100

/*
 * Set by `remix/node-hmr` for the process it supervises: this server then listens behind the
 * proxy that holds it, and the proxy's port is the address a person uses.
 */
const hmrProxyPort = process.env.HMR_PROXY_PORT
  ? Number.parseInt(process.env.HMR_PROXY_PORT, 10)
  : null
const isHmr = process.env.REMIX_NODE_HMR === '1'

/* A rejection ends the process with its message, before the port opens. */
const publikace = await createPublikace(process.env)

const server = http.createServer(
  createRequestListener((request) => publikace.fetch(request), { trustProxy: isHmr }),
)

server.listen(port, () => {
  if (isHmr) {
    import('remix/node-hmr/runtime').then((nodeHmr) => nodeHmr.emitServerReady())
  }

  console.log(`Server listening on http://localhost:${hmrProxyPort ?? port}`)
})

let isShuttingDown = false

function shutdown() {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  server.close(() => {
    publikace.close().finally(() => process.exit(0))
  })
  server.closeAllConnections()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
