import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'

import { assetServer } from './app/assets.ts'
import {
  appOrigin,
  authorizedDomain,
  googleCredentials,
  initialAdminEmail,
  issuesFolderId,
} from './app/auth/environment.server.ts'
import { createAccessDirectory } from './app/data/access.server.ts'
import { defaultDatabase, migrateDatabase } from './app/data/database.server.ts'
import { normalizeEmail } from './app/domain/access.ts'
import { now } from './app/domain/time.ts'
import { createAppRouter } from './app/router.ts'

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 44100

/*
 * Set by `remix/node-hmr` for the process it supervises: this server then listens behind the
 * proxy that holds it, and the proxy's port is the address a person uses.
 */
const hmrProxyPort = process.env.HMR_PROXY_PORT
  ? Number.parseInt(process.env.HMR_PROXY_PORT, 10)
  : null
const isHmr = process.env.REMIX_NODE_HMR === '1'

/*
 * Before the port opens, so no request meets an old schema. One process on one machine is the
 * whole deployment, which is what makes migrating at startup safe.
 */
const database = defaultDatabase()
await migrateDatabase(database.database)

/*
 * The first administrator, only while the access list has no named account (`03`, row 26).
 * Production refuses to start when nobody could ever change the list, and the reads before it
 * refuse a missing domain, origin, Google client or issues folder there, so a deployment that
 * could let nobody in, or create no issue, fails here rather than at somebody's first click.
 */
authorizedDomain()
appOrigin()
googleCredentials()
issuesFolderId()
const initialAdmin = normalizeEmail(initialAdminEmail())
const directory = createAccessDirectory(database.database)
if (initialAdmin !== '') {
  await directory.seedInitialAdmin(initialAdmin, now())
} else if (process.env.NODE_ENV === 'production' && (await directory.listAccounts()).length === 0) {
  throw new Error('Přístup nemá žádný jmenovaný účet a chybí INITIAL_ADMIN_EMAIL.')
}

const router = createAppRouter({ database: database.database })

const server = http.createServer(
  createRequestListener(
    async (request) => {
      try {
        return await router.fetch(request)
      } catch (error) {
        // A request the browser gave up on rejects with its own abort reason, which is noise.
        if (!(request.signal.aborted && error === request.signal.reason)) {
          console.error(error)
        }
        return new Response('Internal Server Error', { status: 500 })
      }
    },
    { trustProxy: isHmr },
  ),
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
    Promise.allSettled([assetServer.close(), database.close()]).finally(() => process.exit(0))
  })
  server.closeAllConnections()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
