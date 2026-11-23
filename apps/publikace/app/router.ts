import { fileURLToPath } from 'node:url'
import type { Database } from 'remix/data-table'
import { asyncContext } from 'remix/middleware/async-context'
import { compression } from 'remix/middleware/compression'
import { Auth } from 'remix/middleware/auth'
import { csrf } from 'remix/middleware/csrf'
import { formData } from 'remix/middleware/form-data'
import type { logger } from 'remix/middleware/logger'
import { session } from 'remix/middleware/session'
import { staticFiles } from 'remix/middleware/static'
import { createRouter, type MiddlewareContext, type RequestContext } from 'remix/router'

import createAuthController from './actions/auth/controller.tsx'
import createGoogleController from './actions/auth/google/controller.tsx'
import createHomeController from './actions/controller.tsx'
import createProofreadingController from './actions/proofreading/controller.tsx'
import createIssuesController from './actions/issues/controller.tsx'
import createApprovalsController from './actions/api/approvals/controller.ts'
import createPrintHandoffController from './actions/api/print-handoff/controller.ts'
import createArtworkRepliesController from './actions/api/artwork-replies/controller.ts'
import createProofreadingDigestController from './actions/api/proofreading-digest/controller.ts'
import createArtworksController from './actions/links/artworks/controller.tsx'
import createLinksController from './actions/links/controller.tsx'
import createReviewController from './actions/review/controller.tsx'
import createDriveAccountController from './actions/settings/account/controller.tsx'
import createSettingsController from './actions/settings/controller.tsx'
import createJobsController from './actions/settings/jobs/controller.tsx'
import type { Assets } from './assets.ts'
import {
  appOrigin,
  articleTemplateDocumentId,
  authorizedDomain,
  driveAccountEmail,
  driveTokenKey,
  type Environment,
  googleCredentials,
  type GoogleCredentials,
  groupMembershipEndpoint,
  issuesFolderId,
  mailSendEndpoint,
  publicMailPerDay,
  registrySpreadsheetId,
  scriptJobAccount,
  scriptTokenAudiences,
} from './auth/environment.server.ts'
import {
  createMembershipCheck,
  type MembershipCheck,
  membershipUnavailable,
  rememberGroupNames,
} from './auth/group-membership.server.ts'
import {
  createIdentityTokenVerifier,
  type IdentityTokenVerifier,
} from './auth/identity-token.server.ts'
import { createSessionCookie, createSignedInUntilCookie } from './auth/session.server.ts'
import { createAccessDirectory } from './data/access.server.ts'
import { createAnswerStore } from './data/answers.server.ts'
import { createArticleStore } from './data/articles.server.ts'
import { createArtworkStore } from './data/artworks.server.ts'
import { createDriveAccountStore } from './data/drive-account.server.ts'
import { createIssueStore } from './data/issues.server.ts'
import { createJobRunStore } from './data/job-runs.server.ts'
import { createLinkStore } from './data/links.server.ts'
import { createPrintHandoffStore } from './data/print-handoff.server.ts'
import { createProofreadersStore } from './data/proofreaders.server.ts'
import { createRecordStore } from './data/record.server.ts'
import { createPublicMailLog } from './data/public-mail.server.ts'
import { createSqliteSessionStorage } from './data/session-storage.server.ts'
import { DEFAULT_PUBLIC_MAIL_PER_DAY } from './domain/artwork.ts'
import { now } from './domain/time.ts'
import { driveAccessToken } from './drive/access-token.server.ts'
import { createArticleFiles } from './drive/article-files.server.ts'
import type { ArticleSetup } from './drive/article-setup.server.ts'
import { createArtworkFiles } from './drive/artwork-files.server.ts'
import type { ArtworksSetup } from './drive/artworks-setup.server.ts'
import { createDriveFolders } from './drive/folders.server.ts'
import type { IssueSetup } from './drive/issue-setup.server.ts'
import { createLock } from './drive/one-at-a-time.server.ts'
import type { RecordQueue } from './drive/record-queue.server.ts'
import { createRecordSheets } from './drive/sheets.server.ts'
import { createMailer, type Mailer, mailerUnavailable } from './mail/mailer.server.ts'
import { loadAccess } from './middleware/access.server.ts'
import { loadArticles } from './middleware/articles.server.ts'
import { serveAssets } from './middleware/assets.server.ts'
import { loadAuth, signInRedirect } from './middleware/auth.server.ts'
import { loadDriveAccount } from './middleware/drive-account.server.ts'
import { loadFailingJobs } from './middleware/failing-jobs.server.ts'
import { loadIssues } from './middleware/issues.server.ts'
import { loadProofreadingCount } from './middleware/proofreading-count.server.ts'
import { loadReviewCount } from './middleware/review-count.server.ts'
import { publicLinkHeaders, skipWithoutSession } from './middleware/public-link.server.ts'
import { render } from './middleware/render.tsx'
import { logRequests } from './middleware/request-log.server.ts'
import { takeToasts } from './middleware/toasts.server.ts'
import { routes } from './routes.ts'

/* `favicon.svg` and the like, from the repository whichever directory the process started in. */
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url))

/**
 * The context every controller sees. Exported for the type alone: building a router opens
 * nothing by itself, but `createPublikace` and the tests are the ones that decide on which database.
 *
 * Under `/l/` and `/api/` the session, the sign-in and the toasts are not there, though the type
 * says they are: `skipWithoutSession()` takes their middlewares out at runtime. A controller for
 * those addresses reads only what it loads itself, as the links controller does.
 */
export type AppContext = MiddlewareContext<
  [
    ReturnType<typeof logger>,
    ReturnType<typeof render>,
    ReturnType<typeof formData>,
    ReturnType<typeof session>,
    ReturnType<typeof loadAccess>,
    ReturnType<typeof loadDriveAccount>,
    ReturnType<typeof loadIssues>,
    ReturnType<typeof loadArticles>,
    ReturnType<typeof loadAuth>,
    ReturnType<typeof loadReviewCount>,
    ReturnType<typeof loadFailingJobs>,
    ReturnType<typeof takeToasts>,
  ]
>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

export type AppDependencies = {
  /** The asset server and the addresses every page links to. */
  assets: Assets
  /** Asks about a group. Defaults to the configured service. */
  checkMembership?: MembershipCheck
  database: Database
  /** Without the `@`. Defaults to `AUTHORIZED_DOMAIN`. */
  domain?: string
  /** The only account accepted as the app's account on Drive. Defaults to `DRIVE_ACCOUNT_EMAIL`. */
  driveAccountEmail?: string
  /** Encrypts the Drive token. Defaults to `DRIVE_TOKEN_KEY`. */
  driveTokenKey?: Buffer
  /** The variables the app was started with; every default below is read from it. */
  environment: Environment
  /** Every call to Google's token endpoint and to Drive. Defaults to the global `fetch`. */
  fetch?: typeof globalThis.fetch
  /** The OAuth client the Drive token is exchanged with. Defaults to `GOOGLE_CLIENT_ID`/`_SECRET`. */
  googleCredentials?: GoogleCredentials | null
  /** The folder that holds every issue. Defaults to `ISSUES_FOLDER_ID`. */
  issuesFolderId?: string
  /** Sends the welcome e-mails and the consent requests. Defaults to the Mailer of `publikace@`. */
  mailer?: Mailer
  /** The cap on e-mails public pages start in a day. Defaults to `PUBLIC_MAIL_PER_DAY`. */
  mailPerDay?: number
  /** The Registr the record queue writes its list into. Defaults to `REGISTRY_SPREADSHEET_ID`. */
  registrySpreadsheetId?: string
  /** The Doc every article is copied from. Defaults to `ARTICLE_TEMPLATE_DOCUMENT_ID`. */
  templateId?: string
  /** The account the background jobs run as. Defaults to `SCRIPT_JOB_ACCOUNT`. */
  jobAccount?: string
  /** Checks a call from a background job. Defaults to Google's keys on `fetch`. */
  verifyJobToken?: IdentityTokenVerifier
}

/** What a setup reads; the assets serve pages only. */
export type SetupDependencies = Omit<AppDependencies, 'assets'>

function defaultMailer(environment: Environment): Mailer {
  let endpoint = mailSendEndpoint(environment)
  return endpoint === null ? mailerUnavailable : createMailer(endpoint)
}

/**
 * How an article is made, on the app's database. `createPublikace` builds one too, for the
 * cleanup it runs before the first request.
 */
export function createArticleSetup(dependencies: SetupDependencies): ArticleSetup {
  let fetch = dependencies.fetch ?? globalThis.fetch
  let credentials =
    dependencies.googleCredentials === undefined
      ? googleCredentials(dependencies.environment)
      : dependencies.googleCredentials
  let driveAccountStore = createDriveAccountStore(
    dependencies.database,
    dependencies.driveTokenKey ?? driveTokenKey(dependencies.environment),
  )
  return {
    articles: createArticleStore(dependencies.database),
    files: (accessToken) => createArticleFiles({ accessToken, fetch }),
    folders: (accessToken) => createDriveFolders({ accessToken, fetch }),
    issues: createIssueStore(dependencies.database),
    links: createLinkStore(dependencies.database),
    mailLog: createPublicMailLog(dependencies.database),
    mailPerDay:
      dependencies.mailPerDay ??
      publicMailPerDay(dependencies.environment, DEFAULT_PUBLIC_MAIL_PER_DAY),
    mailer: dependencies.mailer ?? defaultMailer(dependencies.environment),
    now,
    origin: appOrigin(dependencies.environment),
    templateId: dependencies.templateId ?? articleTemplateDocumentId(dependencies.environment),
    token: () => driveAccessToken({ credentials, fetch, store: driveAccountStore }),
  }
}

/**
 * How artworks are uploaded and sent, on the app's database, with the same Drive account and
 * Mailer as an article. `createPublikace` builds one too, for the cleanup it runs before the
 * first request.
 */
export function createArtworksSetup(
  dependencies: SetupDependencies,
  articleSetup: ArticleSetup = createArticleSetup(dependencies),
): ArtworksSetup {
  let fetch = dependencies.fetch ?? globalThis.fetch
  return {
    articles: articleSetup.articles,
    artworks: createArtworkStore(dependencies.database),
    files: (accessToken) => createArtworkFiles({ accessToken, fetch }),
    folders: articleSetup.folders,
    issues: articleSetup.issues,
    links: articleSetup.links,
    mailLog: articleSetup.mailLog,
    mailPerDay: articleSetup.mailPerDay,
    mailer: articleSetup.mailer,
    now,
    token: articleSetup.token,
  }
}

/**
 * The record queue on the app's database (#111), under the same Drive account as every other
 * action. `createPublikace` starts it and `close()` stops it.
 */
export function createRecordQueue(
  dependencies: SetupDependencies,
  articleSetup: ArticleSetup = createArticleSetup(dependencies),
): RecordQueue {
  let fetch = dependencies.fetch ?? globalThis.fetch
  let editor = dependencies.driveAccountEmail ?? driveAccountEmail(dependencies.environment)
  return {
    articles: articleSetup.articles,
    artworks: createArtworkStore(dependencies.database),
    issues: articleSetup.issues,
    marks: createRecordStore(dependencies.database),
    now,
    origin: appOrigin(dependencies.environment),
    registryId:
      dependencies.registrySpreadsheetId ?? registrySpreadsheetId(dependencies.environment),
    sheets: (accessToken) => createRecordSheets({ accessToken, editor, fetch }),
    token: articleSetup.token,
  }
}

function defaultMembershipCheck(environment: Environment): MembershipCheck {
  let endpoint = groupMembershipEndpoint(environment)
  return endpoint === null ? membershipUnavailable : createMembershipCheck(endpoint)
}

/**
 * Builds the app on one database. `createPublikace` hands it the file on the volume; a test hands it
 * `:memory:` and a membership check of its own.
 */
export function createAppRouter(dependencies: AppDependencies) {
  let sessionCookie = createSessionCookie(dependencies.environment)
  let signedInUntil = createSignedInUntilCookie(dependencies.environment)
  let directory = createAccessDirectory(dependencies.database)
  let driveAccountStore = createDriveAccountStore(
    dependencies.database,
    dependencies.driveTokenKey ?? driveTokenKey(dependencies.environment),
  )
  let fetch = dependencies.fetch ?? globalThis.fetch
  let credentials =
    dependencies.googleCredentials === undefined
      ? googleCredentials(dependencies.environment)
      : dependencies.googleCredentials
  let issueStore = createIssueStore(dependencies.database)
  /* Read once, so the dialog and Nastavení follow the same Registr (`11d`, `14j`). */
  let registryId =
    dependencies.registrySpreadsheetId ?? registrySpreadsheetId(dependencies.environment)
  let issueSetup: IssueSetup = {
    folders: (accessToken) => createDriveFolders({ accessToken, fetch }),
    issuesFolderId: dependencies.issuesFolderId ?? issuesFolderId(dependencies.environment),
    now,
    store: issueStore,
    token: () => driveAccessToken({ credentials, fetch, store: driveAccountStore }),
  }
  let articleSetup = createArticleSetup(dependencies)
  let artworksSetup = createArtworksSetup(dependencies, articleSetup)
  let checkMembership = rememberGroupNames(
    dependencies.checkMembership ?? defaultMembershipCheck(dependencies.environment),
    directory.recordGroupName,
  )
  let jobRuns = createJobRunStore(dependencies.database)
  let printHandoffs = createPrintHandoffStore(dependencies.database)
  let proofreaders = createProofreadersStore(dependencies.database)

  let router = createRouter({
    /*
     * Ordering matters:
     *   - `logRequests()` outermost, so what it reports is the status and duration the browser
     *     saw, a static file and a refusal included; a shared link's key and a Google callback's
     *     code stay out of the line,
     *   - `compression()` above the static files, because the stylesheet and the fonts are the
     *     largest things the app sends,
     *   - the fast exits next — `staticFiles()` and `serveAssets()` — so no file request ever
     *     reaches the session store; `serveAssets()` also leaves the assets in the context,
     *   - `asyncContext()` above `render()`, so every page drawn, an error page included, reaches
     *     its stylesheet and script entry, and before `csrf()`, so `<CsrfField />` can reach the
     *     token while the page is drawn,
     *   - `render()` above everything a controller uses, so every one has `context.render`,
     *   - `formData()` before `csrf()`, which reads the token from the submitted body,
     *   - `session()` before `csrf()`, whose token lives in it, and before `loadAuth()`, which
     *     reads the person out of it,
     *   - `loadAccess()` before `loadAuth()`, whose ten-minute check asks the access list, and
     *     `loadDriveAccount()` beside it, for the banner every editor screen draws, and
     *     `loadIssues()` beside that,
     *   - `loadAuth()` before `csrf()`, so a refused form can tell an expired sign-in apart, and
     *     `loadReviewCount()` and `loadProofreadingCount()` after it, for the numbers beside _Ke
     *     kontrole_ and _Korektura_ in the panel, and
     *     `loadFailingJobs()` beside that, for the banner of a job that fails or went quiet,
     *   - `takeToasts()` last, so the message is cleared while the session can still be saved.
     *
     * The session, the sign-in, CSRF and the toasts are skipped for a shared link's page and for
     * the API, neither of which sets a cookie (`public-link.server.ts`); `publicLinkHeaders()`
     * marks a shared link's answers `noindex`, and sits right under the logger so that it marks
     * every one of them.
     */
    middleware: [
      logRequests(),
      publicLinkHeaders(),
      compression(),
      staticFiles(PUBLIC_DIR, { index: false }),
      serveAssets(dependencies.assets),
      asyncContext(),
      render(dependencies.assets),
      formData(),
      skipWithoutSession(session(sessionCookie, createSqliteSessionStorage(dependencies.database))),
      loadAccess({
        checkMembership,
        directory,
        domain: dependencies.domain ?? authorizedDomain(dependencies.environment),
        proofreadersAddress: async () => (await proofreaders.find())?.email ?? null,
      }),
      loadDriveAccount({
        expectedEmail: (
          dependencies.driveAccountEmail ?? driveAccountEmail(dependencies.environment)
        ).toLowerCase(),
        store: driveAccountStore,
      }),
      loadIssues({ hasRegistry: registryId !== '', setup: issueSetup, store: issueStore }),
      loadArticles({
        articles: articleSetup.articles,
        artworks: artworksSetup,
        links: articleSetup.links,
        origin: articleSetup.origin,
        printHandoffs,
        proofreaders,
        runs: jobRuns,
        setup: articleSetup,
      }),
      skipWithoutSession(loadAuth({ origin: articleSetup.origin })),
      skipWithoutSession(loadReviewCount(artworksSetup.artworks, articleSetup.articles)),
      skipWithoutSession(loadProofreadingCount(articleSetup.articles)),
      skipWithoutSession(loadFailingJobs(jobRuns, now)),
      skipWithoutSession(
        csrf({
          // Behind a TLS-terminating proxy the request's own URL says `http:`.
          origin: articleSetup.origin,
          /* A form sent after the session expired has lost its token with it. Somebody no longer
           signed in is sent to sign in again (`10a`, `expired`) rather than shown a bare 403. */
          onError: (_reason, context) =>
            context.get(Auth)?.ok === true
              ? new Response('Forbidden', { status: 403 })
              : signInRedirect(context as RequestContext, signedInUntil),
        }),
      ),
      skipWithoutSession(takeToasts()),
    ],
  })

  router.map(routes, createHomeController(signedInUntil))
  router.map(routes.issues, createIssuesController(signedInUntil))
  router.map(routes.proofreading, createProofreadingController(signedInUntil))
  router.map(routes.links, createLinksController())
  router.map(routes.links.artworks, createArtworksController())
  router.map(
    routes.api.artworkReplies,
    createArtworkRepliesController({
      artworks: artworksSetup.artworks,
      jobAccount: (
        dependencies.jobAccount ?? scriptJobAccount(dependencies.environment)
      ).toLowerCase(),
      now,
      runs: jobRuns,
      verifyIdentityToken:
        dependencies.verifyJobToken ??
        createIdentityTokenVerifier({
          audiences: scriptTokenAudiences(dependencies.environment),
          fetch,
        }),
    }),
  )
  router.map(
    routes.api.approvals,
    createApprovalsController({
      articles: articleSetup.articles,
      jobAccount: (
        dependencies.jobAccount ?? scriptJobAccount(dependencies.environment)
      ).toLowerCase(),
      now,
      runs: jobRuns,
      verifyIdentityToken:
        dependencies.verifyJobToken ??
        createIdentityTokenVerifier({
          audiences: scriptTokenAudiences(dependencies.environment),
          fetch,
        }),
    }),
  )
  router.map(
    routes.api.printHandoff,
    createPrintHandoffController({
      handoffs: printHandoffs,
      jobAccount: (
        dependencies.jobAccount ?? scriptJobAccount(dependencies.environment)
      ).toLowerCase(),
      now,
      runs: jobRuns,
      verifyIdentityToken:
        dependencies.verifyJobToken ??
        createIdentityTokenVerifier({
          audiences: scriptTokenAudiences(dependencies.environment),
          fetch,
        }),
    }),
  )
  router.map(
    routes.api.proofreadingDigest,
    createProofreadingDigestController({
      articles: articleSetup.articles,
      jobAccount: (
        dependencies.jobAccount ?? scriptJobAccount(dependencies.environment)
      ).toLowerCase(),
      lock: createLock(),
      mailer: articleSetup.mailer,
      now,
      origin: articleSetup.origin,
      proofreaders,
      runs: jobRuns,
      verifyIdentityToken:
        dependencies.verifyJobToken ??
        createIdentityTokenVerifier({
          audiences: scriptTokenAudiences(dependencies.environment),
          fetch,
        }),
    }),
  )
  router.map(
    routes.review,
    createReviewController(signedInUntil, {
      answers: createAnswerStore(dependencies.database),
      articles: articleSetup.articles,
      artworks: artworksSetup.artworks,
      mailer: articleSetup.mailer,
      mailLog: articleSetup.mailLog,
      mailPerDay: articleSetup.mailPerDay,
      runs: jobRuns,
    }),
  )
  router.map(routes.auth, createAuthController(signedInUntil))
  router.map(
    routes.auth.google,
    createGoogleController(signedInUntil, { credentials, origin: articleSetup.origin }),
  )
  router.map(
    routes.settings,
    createSettingsController(signedInUntil, {
      driveFiles: {
        issuesFolderId: dependencies.issuesFolderId ?? issuesFolderId(dependencies.environment),
        registrySpreadsheetId: registryId,
        templateId: articleSetup.templateId,
      },
      proofreaders,
      runs: jobRuns,
    }),
  )
  router.map(
    routes.settings.account,
    createDriveAccountController(signedInUntil, { credentials, origin: articleSetup.origin }),
  )
  router.map(
    routes.settings.jobs,
    createJobsController(signedInUntil, { proofreaders, runs: jobRuns }),
  )

  return router
}
