import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'

import { startRecordQueue } from '../app/drive/record-queue.server.ts'
import { createFakeApp } from '../app/fake-app.server.ts'

/*
 * `pnpm app:fake`: the app on the fake Drive, the fake Mailer and an in-memory database, with its
 * controls at `/_fake` (`app/fake-app.server.ts`). Started without `--env-file`, so `.env` is
 * never read, and every call to Google is answered by the fake.
 *
 * It listens on 127.0.0.1 alone, because the controls can sign anybody in. The origin is the app's
 * one variable, so that CSRF and every address the pages print name this server, and the port
 * differs from `app:dev`'s so both can run at once.
 */

if (process.env.NODE_ENV === 'production') {
  console.error('pnpm app:fake does not run with NODE_ENV=production.')
  process.exit(1)
}

const host = '127.0.0.1'
const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 44110
const fakeApp = await createFakeApp({
  APP_ORIGIN: `http://${host}:${port}`,
  NODE_ENV: process.env.NODE_ENV,
})
/* The record follows the fake database as it follows the real one, into the fake Registr. */
const recordQueue = startRecordQueue(fakeApp.app.record)

let mailPrinted = 0
const server = http.createServer(
  createRequestListener(async (request) => {
    try {
      return await fakeApp.fetch(request)
    } catch (error) {
      if (!(request.signal.aborted && error === request.signal.reason)) console.error(error)
      return new Response('Internal Server Error', { status: 500 })
    } finally {
      for (let message of fakeApp.app.mail.slice(mailPrinted)) {
        console.log(`[mail] to ${message.to}: ${message.subject}`)
      }
      mailPrinted = fakeApp.app.mail.length
    }
  }),
)

server.listen(port, host, async () => {
  let addresses = await fakeApp.addresses()
  console.log(`Fake app on http://${host}:${port}`)
  console.log(`  controls:      ${addresses.controls}`)
  console.log(`  article page:  ${addresses.article}`)
  console.log(`  artworks page: ${addresses.artworks}`)
})

let isShuttingDown = false

function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true
  let passUnderWay = recordQueue.stop()
  server.close(() => {
    passUnderWay.then(() => fakeApp.close()).finally(() => process.exit(0))
  })
  server.closeAllConnections()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
