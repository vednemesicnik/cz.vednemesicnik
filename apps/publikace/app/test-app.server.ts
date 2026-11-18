import { createSession } from 'remix/session'

import type { MembershipAnswer, MembershipCheck } from './auth/group-membership.server.ts'
import {
  createSessionCookie,
  EDITOR_SESSION_KEY,
  type StoredEditor,
} from './auth/session.server.ts'
import { type AccessDirectory, createAccessDirectory } from './data/access.server.ts'
import { createDriveAccountStore, type DriveAccountStore } from './data/drive-account.server.ts'
import { createIssueStore } from './data/issues.server.ts'
import { migrateDatabase, type OpenDatabase, openDatabase } from './data/database.server.ts'
import { createSqliteSessionStorage } from './data/session-storage.server.ts'
import { now } from './domain/time.ts'
import { createFakeDrive, type FakeDrive } from './drive/fake-drive.server.ts'
import type { MailMessage } from './mail/mailer.server.ts'
import { createAppRouter } from './router.ts'

/** The domain every test runs on, fictional like everything else in the suite. */
export const TEST_DOMAIN = 'vednemesicnik.test'

/** The app's account on Drive in the suite, on the same fictional domain. */
export const TEST_DRIVE_ACCOUNT = 'publikace.app@vednemesicnik.test'

/** The key the suite encrypts the Drive token with. */
export const TEST_DRIVE_TOKEN_KEY = Buffer.alloc(32, 3)

/** The folder on the fake shared drive that holds every issue. */
export const TEST_ISSUES_FOLDER = 'fake-issues-folder'

/** The article template on the fake shared drive. */
export const TEST_TEMPLATE = 'fake-article-template'

const ORIGIN = 'http://localhost:44100'

export type TestApp = {
  /** A browser with its own cookies; it starts signed out. */
  browser(): TestBrowser
  close(): Promise<void>
  database: OpenDatabase['database']
  directory: AccessDirectory
  /** Google as the app sees it in the suite: the token endpoint and Drive's files. */
  drive: FakeDrive
  /** Every message the app handed the Mailer, in order. */
  mail: MailMessage[]
  /** The store of the app's account on Drive, on the same database. */
  driveAccount: DriveAccountStore
  /** Sets what the fake membership service answers for a group. */
  setMembership(group: string, answer: (email: string) => MembershipAnswer): void
}

export type TestBrowser = {
  cookie(name: string): string | undefined
  /** `GET`, following no redirect. */
  get(path: string, headers?: HeadersInit): Promise<Response>
  /** `POST` of a form, with the CSRF token of the page the form is on (`from`). */
  post(path: string, fields: Record<string, string>, from?: string): Promise<Response>
  /** `POST` of a body as it is, repeated fields included, with no CSRF token: a public form. */
  send(path: string, body: URLSearchParams): Promise<Response>
  /** Keeps a cookie as a `Set-Cookie` value would give it. */
  setCookie(serialized: string): void
  /** Signs in as somebody already allowed, the way the Google callback would leave it. */
  signInAs(email: string, displayName?: string, authorizedUntil?: number): Promise<void>
}

/**
 * The whole app on an empty `:memory:` database and a fake membership service, with a
 * browser that keeps cookies. Nothing leaves the process.
 */
export async function createTestApp(): Promise<TestApp> {
  let opened = openDatabase(':memory:')
  await migrateDatabase(opened.database)

  let answers = new Map<string, (email: string) => MembershipAnswer>()
  let checkMembership: MembershipCheck = async (email, group) =>
    answers.get(group)?.(email) ?? { status: 'unknown-group' }

  let drive = createFakeDrive()
  drive.seedTemplate(TEST_TEMPLATE, 'Šablona článku')
  let mail: MailMessage[] = []
  let router = createAppRouter({
    checkMembership,
    database: opened.database,
    domain: TEST_DOMAIN,
    driveAccountEmail: TEST_DRIVE_ACCOUNT,
    driveTokenKey: TEST_DRIVE_TOKEN_KEY,
    fetch: drive.fetch,
    googleCredentials: { clientId: 'test-client', clientSecret: 'test-secret' },
    issuesFolderId: TEST_ISSUES_FOLDER,
    mailer: async (message) => {
      mail.push(message)
      return { ok: true }
    },
    templateId: TEST_TEMPLATE,
  })
  let storage = createSqliteSessionStorage(opened.database)
  let sessionCookie = createSessionCookie()

  function browser(): TestBrowser {
    let jar = new Map<string, string>()

    function cookieHeader(): string {
      return [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
    }

    function keep(response: Response): Response {
      for (let line of response.headers.getSetCookie()) {
        let [pair = '', ...attributes] = line.split(';')
        let separator = pair.indexOf('=')
        let name = pair.slice(0, separator).trim()
        let value = pair.slice(separator + 1).trim()
        let isGone =
          value === '' || attributes.some((attribute) => /^\s*max-age=0\s*$/i.test(attribute))
        if (isGone) jar.delete(name)
        else jar.set(name, value)
      }
      return response
    }

    async function get(path: string, headers?: HeadersInit): Promise<Response> {
      let all = new Headers(headers)
      if (jar.size > 0) all.set('Cookie', cookieHeader())
      return keep(await router.fetch(new Request(new URL(path, ORIGIN), { headers: all })))
    }

    async function csrfToken(from: string): Promise<string> {
      let html = await (await get(from)).text()
      return /name="_csrf" type="hidden" value="([^"]+)"/.exec(html)?.[1] ?? ''
    }

    return {
      cookie: (name) => jar.get(name),
      get,
      async post(path, fields, from = '/settings') {
        // A token given in the fields is sent as it is, without visiting the page first.
        let token = fields._csrf ?? (await csrfToken(from))
        let body = new URLSearchParams({ ...fields, _csrf: token })
        let request = new Request(new URL(path, ORIGIN), {
          body,
          headers: { Cookie: cookieHeader(), Origin: ORIGIN, Referer: new URL(from, ORIGIN).href },
          method: 'POST',
        })
        return keep(await router.fetch(request))
      },
      async send(path, body) {
        let headers = new Headers({ Origin: ORIGIN })
        if (jar.size > 0) headers.set('Cookie', cookieHeader())
        return keep(
          await router.fetch(new Request(new URL(path, ORIGIN), { body, headers, method: 'POST' })),
        )
      },
      setCookie(serialized) {
        keep(new Response(null, { headers: { 'Set-Cookie': serialized } }))
      },
      async signInAs(email, displayName = email, authorizedUntil = Date.now() + 60_000) {
        let session = createSession()
        session.set(EDITOR_SESSION_KEY, {
          authorizedUntil,
          displayName,
          email,
        } satisfies StoredEditor)
        let id = await storage.save(session)
        if (id === null) throw new Error('The test session was not saved.')
        // The session middleware wraps the id with its expiry, and reads nothing else.
        let value = JSON.stringify({ expires: Date.now() + 60 * 60 * 1000, value: id })
        let [pair = ''] = (await sessionCookie.serialize(value)).split(';')
        let separator = pair.indexOf('=')
        jar.set(pair.slice(0, separator), pair.slice(separator + 1))
      },
    }
  }

  return {
    browser,
    close: opened.close,
    database: opened.database,
    directory: createAccessDirectory(opened.database),
    drive,
    driveAccount: createDriveAccountStore(opened.database, TEST_DRIVE_TOKEN_KEY),
    mail,
    setMembership(group, answer) {
      answers.set(group, answer)
    },
  }
}

/** Connects the Drive account straight in the database, as a return from Google would. */
export async function connectDriveAccount(app: TestApp): Promise<void> {
  await app.driveAccount.connect({
    at: now(),
    by: 'marie@vednemesicnik.test',
    email: TEST_DRIVE_ACCOUNT,
    refreshToken: 'test-refresh-token',
  })
}

/** Adds an administrator straight to the list, as `INITIAL_ADMIN_EMAIL` does at startup. */
export async function seedAdmin(app: TestApp, email: string): Promise<void> {
  await app.directory.seedInitialAdmin(email, now())
}

const SEEDED_AT = Temporal.Instant.from('2026-11-18T09:00:00Z')

/** An issue with its three folders stored, completed or not. */
export async function seedIssue(
  app: TestApp,
  name = 'VDM_2026_6',
  options: { isComplete?: boolean } = {},
): Promise<number> {
  let issues = createIssueStore(app.database)
  let inserted = await issues.insert({
    at: SEEDED_AT,
    name,
    startedByEmail: 'marie@vednemesicnik.test',
    startedByName: 'Marie Horáková',
  })
  if (!inserted.ok) throw new Error('The issue was not seeded.')
  let id = inserted.issue.id
  await issues.setFolder(id, 'issue', `f-${name}`)
  await issues.setFolder(id, 'articles', `f-${name}-articles`)
  await issues.setFolder(id, 'print', `f-${name}-print`)
  if (options.isComplete !== false) await issues.complete(id, SEEDED_AT)
  return id
}
