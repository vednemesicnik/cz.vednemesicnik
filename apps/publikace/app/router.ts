import type { Database } from 'remix/data-table'
import { asyncContext } from 'remix/middleware/async-context'
import { compression } from 'remix/middleware/compression'
import { Auth } from 'remix/middleware/auth'
import { csrf } from 'remix/middleware/csrf'
import { formData } from 'remix/middleware/form-data'
import { logger } from 'remix/middleware/logger'
import { session } from 'remix/middleware/session'
import { staticFiles } from 'remix/middleware/static'
import { createRouter, type MiddlewareContext, type RequestContext } from 'remix/router'

import createAuthController from './actions/auth/controller.tsx'
import createGoogleController from './actions/auth/google/controller.tsx'
import createHomeController from './actions/controller.tsx'
import createIssuesController from './actions/issues/controller.tsx'
import createLinksController from './actions/links/controller.tsx'
import createDriveAccountController from './actions/settings/account/controller.tsx'
import createSettingsController from './actions/settings/controller.tsx'
import {
  appOrigin,
  articleTemplateDocumentId,
  authorizedDomain,
  driveAccountEmail,
  driveTokenKey,
  googleCredentials,
  type GoogleCredentials,
  groupMembershipEndpoint,
  issuesFolderId,
  mailSendEndpoint,
} from './auth/environment.server.ts'
import {
  createMembershipCheck,
  type MembershipCheck,
  membershipUnavailable,
} from './auth/group-membership.server.ts'
import { createSessionCookie, createSignedInUntilCookie } from './auth/session.server.ts'
import { createAccessDirectory } from './data/access.server.ts'
import { createArticleStore } from './data/articles.server.ts'
import { createDriveAccountStore } from './data/drive-account.server.ts'
import { createIssueStore } from './data/issues.server.ts'
import { createLinkStore } from './data/links.server.ts'
import { createSqliteSessionStorage } from './data/session-storage.server.ts'
import { now } from './domain/time.ts'
import { driveAccessToken } from './drive/access-token.server.ts'
import { createArticleFiles } from './drive/article-files.server.ts'
import type { ArticleSetup } from './drive/article-setup.server.ts'
import { createDriveFolders } from './drive/folders.server.ts'
import type { IssueSetup } from './drive/issue-setup.server.ts'
import { createMailer, type Mailer, mailerUnavailable } from './mail/mailer.server.ts'
import { loadAccess } from './middleware/access.server.ts'
import { loadArticles } from './middleware/articles.server.ts'
import { serveAssets } from './middleware/assets.server.ts'
import { loadAuth, signInRedirect } from './middleware/auth.server.ts'
import { loadDriveAccount } from './middleware/drive-account.server.ts'
import { loadIssues } from './middleware/issues.server.ts'
import { publicLinkHeaders, skipForPublicLinks } from './middleware/public-link.server.ts'
import { render } from './middleware/render.tsx'
import { takeToasts } from './middleware/toasts.server.ts'
import { routes } from './routes.ts'

/**
 * The context every controller sees. Exported for the type alone: building a router opens
 * nothing by itself, but `server.ts` and the tests are the ones that decide on which database.
 *
 * Under `/l/` the session, the sign-in and the toasts are not there, though the type says they
 * are: `skipForPublicLinks()` takes their middlewares out at runtime. A controller for those pages
 * reads only what it loads itself, as the links controller does.
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
    ReturnType<typeof takeToasts>,
  ]
>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

export type AppDependencies = {
  /** Asks about a group. Defaults to the configured service. */
  checkMembership?: MembershipCheck
  database: Database
  /** Without the `@`. Defaults to `AUTHORIZED_DOMAIN`. */
  domain?: string
  /** The only account accepted as the app's account on Drive. Defaults to `DRIVE_ACCOUNT_EMAIL`. */
  driveAccountEmail?: string
  /** Encrypts the Drive token. Defaults to `DRIVE_TOKEN_KEY`. */
  driveTokenKey?: Buffer
  /** Every call to Google's token endpoint and to Drive. Defaults to the global `fetch`. */
  fetch?: typeof globalThis.fetch
  /** The OAuth client the Drive token is exchanged with. Defaults to `GOOGLE_CLIENT_ID`/`_SECRET`. */
  googleCredentials?: GoogleCredentials | null
  /** The folder that holds every issue. Defaults to `ISSUES_FOLDER_ID`. */
  issuesFolderId?: string
  /** Sends the welcome e-mails. Defaults to the configured Mailer of `publikace@`. */
  mailer?: Mailer
  /** The Doc every article is copied from. Defaults to `ARTICLE_TEMPLATE_DOCUMENT_ID`. */
  templateId?: string
}

function defaultMailer(): Mailer {
  let endpoint = mailSendEndpoint()
  return endpoint === null ? mailerUnavailable : createMailer(endpoint)
}

/**
 * How an article is made, on the app's database. `server.ts` builds one too, for the cleanup
 * it runs before listening.
 */
export function createArticleSetup(dependencies: AppDependencies): ArticleSetup {
  let fetch = dependencies.fetch ?? globalThis.fetch
  let credentials =
    dependencies.googleCredentials === undefined
      ? googleCredentials()
      : dependencies.googleCredentials
  let driveAccountStore = createDriveAccountStore(
    dependencies.database,
    dependencies.driveTokenKey ?? driveTokenKey(),
  )
  return {
    articles: createArticleStore(dependencies.database),
    files: (accessToken) => createArticleFiles({ accessToken, fetch }),
    folders: (accessToken) => createDriveFolders({ accessToken, fetch }),
    issues: createIssueStore(dependencies.database),
    links: createLinkStore(dependencies.database),
    mailer: dependencies.mailer ?? defaultMailer(),
    now,
    origin: appOrigin(),
    templateId: dependencies.templateId ?? articleTemplateDocumentId(),
    token: () => driveAccessToken({ credentials, fetch, store: driveAccountStore }),
  }
}

function defaultMembershipCheck(): MembershipCheck {
  let endpoint = groupMembershipEndpoint()
  return endpoint === null ? membershipUnavailable : createMembershipCheck(endpoint)
}

/**
 * Builds the app on one database. `server.ts` hands it the file on the volume; a test hands it
 * `:memory:` and a membership check of its own.
 */
export function createAppRouter(dependencies: AppDependencies) {
  let sessionCookie = createSessionCookie()
  let signedInUntil = createSignedInUntilCookie()
  let directory = createAccessDirectory(dependencies.database)
  let driveAccountStore = createDriveAccountStore(
    dependencies.database,
    dependencies.driveTokenKey ?? driveTokenKey(),
  )
  let fetch = dependencies.fetch ?? globalThis.fetch
  let credentials =
    dependencies.googleCredentials === undefined
      ? googleCredentials()
      : dependencies.googleCredentials
  let issueStore = createIssueStore(dependencies.database)
  let issueSetup: IssueSetup = {
    folders: (accessToken) => createDriveFolders({ accessToken, fetch }),
    issuesFolderId: dependencies.issuesFolderId ?? issuesFolderId(),
    now,
    store: issueStore,
    token: () => driveAccessToken({ credentials, fetch, store: driveAccountStore }),
  }
  let articleSetup = createArticleSetup(dependencies)

  let router = createRouter({
    /*
     * Ordering matters:
     *   - `logger()` outermost, so what it reports is the status and duration the browser saw,
     *     a static file and a refusal included,
     *   - `compression()` above the static files, because the stylesheet and the fonts are the
     *     largest things the app sends,
     *   - the fast exits next — `staticFiles()` and `serveAssets()` — so no file request ever
     *     reaches the session store,
     *   - `render()` above everything a controller uses, so every one has `context.render`,
     *   - `formData()` before `csrf()`, which reads the token from the submitted body,
     *   - `session()` before `csrf()`, whose token lives in it, and before `loadAuth()`, which
     *     reads the person out of it,
     *   - `asyncContext()` before `csrf()`, so `<CsrfField />` can reach the token while the
     *     page is drawn,
     *   - `loadAccess()` before `loadAuth()`, whose ten-minute check asks the access list, and
     *     `loadDriveAccount()` beside it, for the banner every editor screen draws, and
     *     `loadIssues()` beside that,
     *   - `loadAuth()` before `csrf()`, so a refused form can tell an expired sign-in apart,
     *   - `takeToasts()` last, so the message is cleared while the session can still be saved.
     *
     * The session, the sign-in, CSRF and the toasts are skipped for a shared link's page, which
     * sets no cookie (`public-link.server.ts`); `publicLinkHeaders()` marks those answers
     * `noindex`, and sits right under the logger so that it marks every one of them.
     */
    middleware: [
      logger(),
      publicLinkHeaders(),
      compression(),
      staticFiles('./public', { index: false }),
      serveAssets(),
      render(),
      formData(),
      skipForPublicLinks(session(sessionCookie, createSqliteSessionStorage(dependencies.database))),
      asyncContext(),
      loadAccess({
        checkMembership: dependencies.checkMembership ?? defaultMembershipCheck(),
        directory,
        domain: dependencies.domain ?? authorizedDomain(),
      }),
      loadDriveAccount({
        expectedEmail: (dependencies.driveAccountEmail ?? driveAccountEmail()).toLowerCase(),
        store: driveAccountStore,
      }),
      loadIssues({ setup: issueSetup, store: issueStore }),
      loadArticles({
        articles: articleSetup.articles,
        links: articleSetup.links,
        origin: articleSetup.origin,
        setup: articleSetup,
      }),
      skipForPublicLinks(loadAuth()),
      skipForPublicLinks(
        csrf({
          // Behind a TLS-terminating proxy the request's own URL says `http:`.
          origin: appOrigin(),
          /* A form sent after the session expired has lost its token with it. Somebody no longer
           signed in is sent to sign in again (`10a`, `expired`) rather than shown a bare 403. */
          onError: (_reason, context) =>
            context.get(Auth)?.ok === true
              ? new Response('Forbidden', { status: 403 })
              : signInRedirect(context as RequestContext, signedInUntil),
        }),
      ),
      skipForPublicLinks(takeToasts()),
    ],
  })

  router.map(routes, createHomeController(signedInUntil))
  router.map(routes.issues, createIssuesController(signedInUntil))
  router.map(routes.links, createLinksController())
  router.map(routes.auth, createAuthController(signedInUntil))
  router.map(routes.auth.google, createGoogleController(signedInUntil))
  router.map(routes.settings, createSettingsController(signedInUntil))
  router.map(routes.settings.account, createDriveAccountController(signedInUntil))

  return router
}
