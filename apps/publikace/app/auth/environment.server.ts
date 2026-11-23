import type { TokenAudiences } from './identity-token.server.ts'

/**
 * The app's configuration, read from the record `createPublikace` was handed and never from
 * `process.env`, so that a host can give the app values of its own under the names it expects.
 *
 * **Production never falls back.** A missing variable throws at startup, where somebody will
 * notice, rather than quietly weakening who may sign in. Outside production the app still
 * starts without Google or the membership service, so it can be worked on with no `.env`;
 * then nobody can sign in, which is the safe way for it to be incomplete.
 */

/** The variables the app is started with, by the names `.env.example` documents. */
export type Environment = Readonly<Record<string, string | undefined>>

export function isProduction(environment: Environment): boolean {
  return environment.NODE_ENV === 'production'
}

function required(environment: Environment, name: string): string {
  let value = environment[name]
  if (value === undefined || value === '') {
    throw new Error(`Chybí povinná proměnná prostředí ${name}.`)
  }
  return value
}

function optional(environment: Environment, name: string, fallback = ''): string {
  let value = environment[name]
  return value === undefined || value === '' ? fallback : value
}

/** Signs the session cookie. Several, comma-separated, during a rotation: the newest first. */
export function sessionSecrets(environment: Environment): string[] {
  if (isProduction(environment)) return required(environment, 'SESSION_SECRET').split(',')
  return optional(environment, 'SESSION_SECRET', 'development-only-session-secret').split(',')
}

/** Where the app is reached, for the address Google sends the browser back to. */
export function appOrigin(environment: Environment): string {
  if (isProduction(environment)) return required(environment, 'APP_ORIGIN')
  return optional(environment, 'APP_ORIGIN', 'http://localhost:44100')
}

export type GoogleCredentials = { clientId: string; clientSecret: string }

/** The Google OAuth client, or `null` outside production when it is not configured. */
export function googleCredentials(environment: Environment): GoogleCredentials | null {
  if (isProduction(environment)) {
    return {
      clientId: required(environment, 'GOOGLE_CLIENT_ID'),
      clientSecret: required(environment, 'GOOGLE_CLIENT_SECRET'),
    }
  }

  let clientId = optional(environment, 'GOOGLE_CLIENT_ID')
  let clientSecret = optional(environment, 'GOOGLE_CLIENT_SECRET')
  return clientId === '' || clientSecret === '' ? null : { clientId, clientSecret }
}

/**
 * The Workspace domain every account must be on, without the `@`.
 *
 * No default: a domain written into the source would let everybody on it in the moment somebody
 * forgot the variable. Empty means nobody, and production refuses to start with it empty.
 */
export function authorizedDomain(environment: Environment): string {
  if (isProduction(environment)) return required(environment, 'AUTHORIZED_DOMAIN').toLowerCase()
  return optional(environment, 'AUTHORIZED_DOMAIN').toLowerCase()
}

/** The first administrator, read only while the access list has no named account. */
export function initialAdminEmail(environment: Environment): string {
  return optional(environment, 'INITIAL_ADMIN_EMAIL')
}

export type GroupMembershipEndpoint = { secret: string; url: string }

/** `SCRIPT__Auth__Group_Membership`, or `null` outside production when it is not configured. */
export function groupMembershipEndpoint(environment: Environment): GroupMembershipEndpoint | null {
  if (isProduction(environment)) {
    return {
      secret: required(environment, 'GAS_GROUP_MEMBERSHIP_SECRET'),
      url: required(environment, 'GAS_GROUP_MEMBERSHIP_URL'),
    }
  }

  let url = optional(environment, 'GAS_GROUP_MEMBERSHIP_URL')
  let secret = optional(environment, 'GAS_GROUP_MEMBERSHIP_SECRET')
  return url === '' || secret === '' ? null : { secret, url }
}

/*
 * Development only: a fixed key, so a local database keeps working across restarts. Production
 * refuses to start without its own.
 */
const DEVELOPMENT_DRIVE_TOKEN_KEY = Buffer.alloc(32, 7)

/**
 * The key the refresh token of the Drive account is encrypted with: base64 of 32 bytes.
 *
 * A key of another length is refused even outside production, because it would encrypt nothing
 * the production key could read and hide the mistake until the deployment.
 */
export function driveTokenKey(environment: Environment): Buffer {
  let value = isProduction(environment)
    ? required(environment, 'DRIVE_TOKEN_KEY')
    : optional(environment, 'DRIVE_TOKEN_KEY')
  if (value === '') return DEVELOPMENT_DRIVE_TOKEN_KEY

  let key = Buffer.from(value, 'base64')
  if (key.length !== 32) {
    throw new Error('Proměnná DRIVE_TOKEN_KEY musí být base64 32 bajtů.')
  }
  return key
}

/**
 * The only account the app accepts as its account on Drive, `publikace.app@`. Outside
 * production it is that name on the configured domain.
 */
export function driveAccountEmail(environment: Environment): string {
  if (isProduction(environment)) return required(environment, 'DRIVE_ACCOUNT_EMAIL').toLowerCase()
  return optional(
    environment,
    'DRIVE_ACCOUNT_EMAIL',
    `publikace.app@${authorizedDomain(environment)}`,
  ).toLowerCase()
}

/**
 * The folder on the shared drive _Publikace_ that holds every issue. Optional outside
 * production; without it, creating an issue answers _Disk teď neodpovídá_ and logs why.
 */
export function issuesFolderId(environment: Environment): string {
  return isProduction(environment)
    ? required(environment, 'ISSUES_FOLDER_ID')
    : optional(environment, 'ISSUES_FOLDER_ID')
}

/**
 * The Registr spreadsheet, in which the app writes its own list and never the scripts' Vydání
 * (#111). Optional everywhere until the cutover: without it the Registr is skipped with one line
 * in the log and each Evidence is still written.
 */
export function registrySpreadsheetId(environment: Environment): string {
  return optional(environment, 'REGISTRY_SPREADSHEET_ID')
}

/**
 * The Doc every article is copied from, a Doc without code carrying `{{NAZEV_CLANKU}}` in its
 * body. Optional outside production; without it, creating an article answers _Zkuste článek
 * vytvořit za chvíli znovu._ and logs why.
 */
export function articleTemplateDocumentId(environment: Environment): string {
  return isProduction(environment)
    ? required(environment, 'ARTICLE_TEMPLATE_DOCUMENT_ID')
    : optional(environment, 'ARTICLE_TEMPLATE_DOCUMENT_ID')
}

export type MailSendEndpoint = { secret: string; url: string }

/**
 * The Mailer of the `publikace@` mailbox (`SCRIPT__Mail__Send`), or `null` outside production
 * when it is not configured: an article is then created and its welcome e-mails are logged as
 * not sent.
 */
export function mailSendEndpoint(environment: Environment): MailSendEndpoint | null {
  if (isProduction(environment)) {
    return {
      secret: required(environment, 'MAIL_SEND_SECRET'),
      url: required(environment, 'MAIL_SEND_URL'),
    }
  }
  let url = optional(environment, 'MAIL_SEND_URL')
  let secret = optional(environment, 'MAIL_SEND_SECRET')
  return url === '' || secret === '' ? null : { secret, url }
}

/**
 * The most e-mails the public pages may start in a day, resends included (`02a`, _Ochrana_). A
 * value that is not a positive whole number throws, in production and outside it alike: a cap
 * that silently became no cap is the failure this exists against.
 */
export function publicMailPerDay(environment: Environment, fallback: number): number {
  let value = optional(environment, 'PUBLIC_MAIL_PER_DAY')
  if (value === '') return fallback
  let parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('PUBLIC_MAIL_PER_DAY musí být kladné celé číslo.')
  }
  return parsed
}

/**
 * The audiences an identity token from a background job may carry: the OAuth client of the Cloud
 * project the standalone scripts run in. Required in production; any outside it.
 */
export function scriptTokenAudiences(environment: Environment): TokenAudiences {
  if (!isProduction(environment) && optional(environment, 'SCRIPT_TOKEN_AUDIENCE') === '')
    return 'any'
  return required(environment, 'SCRIPT_TOKEN_AUDIENCE')
    .split(',')
    .map((audience) => audience.trim())
    .filter((audience) => audience !== '')
}

/**
 * The account the background jobs run as, the only one whose token the job's API accepts. Outside
 * production the app's account on Drive, which is the same account.
 */
export function scriptJobAccount(environment: Environment): string {
  if (isProduction(environment)) return required(environment, 'SCRIPT_JOB_ACCOUNT').toLowerCase()
  return optional(environment, 'SCRIPT_JOB_ACCOUNT', driveAccountEmail(environment)).toLowerCase()
}
