import { type Assets, createAssets } from './assets.ts'
import {
  appOrigin,
  articleTemplateDocumentId,
  authorizedDomain,
  driveAccountEmail,
  driveTokenKey,
  type Environment,
  googleCredentials,
  groupMembershipEndpoint,
  initialAdminEmail,
  isProduction,
  issuesFolderId,
  mailSendEndpoint,
  publicMailPerDay,
  scriptJobAccount,
  scriptTokenAudiences,
  sessionSecrets,
} from './auth/environment.server.ts'
import { createAccessDirectory } from './data/access.server.ts'
import {
  databasePath,
  migrateDatabase,
  type OpenDatabase,
  openDatabase,
} from './data/database.server.ts'
import { normalizeEmail } from './domain/access.ts'
import { DEFAULT_PUBLIC_MAIL_PER_DAY } from './domain/artwork.ts'
import { now } from './domain/time.ts'
import { cleanUpAbandoned } from './drive/article-setup.server.ts'
import { cleanUpAbandonedArtworks } from './drive/artworks-setup.server.ts'
import { startRecordQueue } from './drive/record-queue.server.ts'
import {
  createAppRouter,
  createArticleSetup,
  createArtworksSetup,
  createRecordQueue,
} from './router.ts'

/** The running app: what answers its requests and what stops it. */
export type Publikace = {
  /**
   * Stops the record queue, waiting for a pass under way, then closes the asset server and the
   * database. A second call does nothing.
   */
  close(): Promise<void>
  /** Answers one request; an error the router let through is a logged 500. */
  fetch(request: Request): Promise<Response>
}

/**
 * Every read that refuses a production deployment, before anything is opened: a deployment that
 * could let nobody in, or create no issue, fails here rather than at somebody's first click, and a
 * host that started it keeps nothing of it.
 */
function checkConfiguration(environment: Environment): void {
  authorizedDomain(environment)
  appOrigin(environment)
  googleCredentials(environment)
  issuesFolderId(environment)
  sessionSecrets(environment)
  driveTokenKey(environment)
  driveAccountEmail(environment)
  articleTemplateDocumentId(environment)
  mailSendEndpoint(environment)
  groupMembershipEndpoint(environment)
  publicMailPerDay(environment, DEFAULT_PUBLIC_MAIL_PER_DAY)
  scriptTokenAudiences(environment)
  scriptJobAccount(environment)
}

/**
 * Starts the app on the variables it is handed and resolves once it can answer.
 *
 * It owns no process: it listens on nothing, installs no signal handler and never exits. A
 * misconfiguration rejects with its Czech message and leaves nothing open, so a host serving other
 * sites beside it can answer this one's hostname with an error and keep serving the rest.
 * `server.ts` is the host for working on this repository alone.
 */
export async function createPublikace(environment: Environment): Promise<Publikace> {
  checkConfiguration(environment)

  let database: OpenDatabase = openDatabase(databasePath(environment))
  let assets: Assets | null = null

  try {
    /*
     * Before the first request, so no request meets an old schema. One process on one machine is
     * the whole deployment, which is what makes migrating at startup safe.
     */
    await migrateDatabase(database.database)

    /* The first administrator, only while the access list has no named account (`03`, row 26). */
    let initialAdmin = normalizeEmail(initialAdminEmail(environment))
    let directory = createAccessDirectory(database.database)
    if (initialAdmin !== '') {
      await directory.seedInitialAdmin(initialAdmin, now())
    } else if (isProduction(environment) && (await directory.listAccounts()).length === 0) {
      throw new Error('Přístup nemá žádný jmenovaný účet a chybí INITIAL_ADMIN_EMAIL.')
    }

    /*
     * Before the first request, no request is running, so every article attempt and artwork batch
     * left uncommitted is one a crash or a failed cleanup left behind: its files go to the bin now
     * (`11c`), and so does every upload that waited 24 hours unsent (`21d`). A Drive that does not
     * answer delays it to the next send and does not stop the app.
     */
    let setup = { database: database.database, environment }
    try {
      let articleSetup = createArticleSetup(setup)
      await cleanUpAbandoned(articleSetup)
      await cleanUpAbandonedArtworks(createArtworksSetup(setup, articleSetup))
    } catch (error) {
      console.error('[drive] the cleanup at startup did not run:', error)
    }

    assets = await createAssets(environment)
    let router = createAppRouter({ ...setup, assets })

    /*
     * The Registr and each Evidence follow the database from here on (#111), a pass every 30 s
     * that keeps nothing alive and holds no request: a sheet that does not answer only delays them.
     */
    let recordQueue = startRecordQueue(createRecordQueue(setup))

    let openAssets = assets
    let closing: Promise<void> | null = null

    return {
      close() {
        closing ??= recordQueue.stop().then(async () => {
          await Promise.allSettled([openAssets.close(), database.close()])
        })
        return closing
      },
      async fetch(request) {
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
    }
  } catch (error) {
    await Promise.allSettled([assets?.close(), database.close()])
    throw error
  }
}
