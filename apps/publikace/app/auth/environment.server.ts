/**
 * The sign-in configuration, read from the environment.
 *
 * **Production never falls back.** A missing variable throws at startup, where somebody will
 * notice, rather than quietly weakening who may sign in. Outside production the app still
 * starts without Google or the membership service, so it can be worked on with no `.env`;
 * then nobody can sign in, which is the safe way for it to be incomplete.
 */

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function required(name: string): string {
  let value = process.env[name]
  if (value === undefined || value === '') {
    throw new Error(`Chybí povinná proměnná prostředí ${name}.`)
  }
  return value
}

function optional(name: string, fallback = ''): string {
  let value = process.env[name]
  return value === undefined || value === '' ? fallback : value
}

/** Signs the session cookie. Several, comma-separated, during a rotation: the newest first. */
export function sessionSecrets(): string[] {
  if (isProduction()) return required('SESSION_SECRET').split(',')
  return optional('SESSION_SECRET', 'development-only-session-secret').split(',')
}

/** Where the app is reached, for the address Google sends the browser back to. */
export function appOrigin(): string {
  if (isProduction()) return required('APP_ORIGIN')
  return optional('APP_ORIGIN', 'http://localhost:44100')
}

export type GoogleCredentials = { clientId: string; clientSecret: string }

/** The Google OAuth client, or `null` outside production when it is not configured. */
export function googleCredentials(): GoogleCredentials | null {
  if (isProduction()) {
    return {
      clientId: required('GOOGLE_CLIENT_ID'),
      clientSecret: required('GOOGLE_CLIENT_SECRET'),
    }
  }

  let clientId = optional('GOOGLE_CLIENT_ID')
  let clientSecret = optional('GOOGLE_CLIENT_SECRET')
  return clientId === '' || clientSecret === '' ? null : { clientId, clientSecret }
}

/**
 * The Workspace domain every account must be on, without the `@`.
 *
 * No default: a domain written into the source would let everybody on it in the moment somebody
 * forgot the variable. Empty means nobody, and production refuses to start with it empty.
 */
export function authorizedDomain(): string {
  if (isProduction()) return required('AUTHORIZED_DOMAIN').toLowerCase()
  return optional('AUTHORIZED_DOMAIN').toLowerCase()
}

/** The first administrator, read only while the access list has no named account. */
export function initialAdminEmail(): string {
  return optional('INITIAL_ADMIN_EMAIL')
}

export type GroupMembershipEndpoint = { secret: string; url: string }

/** `SCRIPT__Auth__Group_Membership`, or `null` outside production when it is not configured. */
export function groupMembershipEndpoint(): GroupMembershipEndpoint | null {
  if (isProduction()) {
    return {
      secret: required('GAS_GROUP_MEMBERSHIP_SECRET'),
      url: required('GAS_GROUP_MEMBERSHIP_URL'),
    }
  }

  let url = optional('GAS_GROUP_MEMBERSHIP_URL')
  let secret = optional('GAS_GROUP_MEMBERSHIP_SECRET')
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
export function driveTokenKey(): Buffer {
  let value = isProduction() ? required('DRIVE_TOKEN_KEY') : optional('DRIVE_TOKEN_KEY')
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
export function driveAccountEmail(): string {
  if (isProduction()) return required('DRIVE_ACCOUNT_EMAIL').toLowerCase()
  return optional('DRIVE_ACCOUNT_EMAIL', `publikace.app@${authorizedDomain()}`).toLowerCase()
}

/**
 * The folder on the shared drive _Publikace_ that holds every issue. Optional outside
 * production; without it, creating an issue answers _Disk teď neodpovídá_ and logs why.
 */
export function issuesFolderId(): string {
  return isProduction() ? required('ISSUES_FOLDER_ID') : optional('ISSUES_FOLDER_ID')
}

/**
 * The Doc every article is copied from, carrying the bound script and `{{NAZEV_CLANKU}}` in its
 * body. Optional outside production; without it, creating an article answers _Zkuste článek
 * vytvořit za chvíli znovu._ and logs why.
 */
export function articleTemplateDocumentId(): string {
  return isProduction()
    ? required('ARTICLE_TEMPLATE_DOCUMENT_ID')
    : optional('ARTICLE_TEMPLATE_DOCUMENT_ID')
}

export type MailSendEndpoint = { secret: string; url: string }

/**
 * The Mailer of the `publikace@` mailbox (`SCRIPT__Mail__Send`), or `null` outside production
 * when it is not configured: an article is then created and its welcome e-mails are logged as
 * not sent.
 */
export function mailSendEndpoint(): MailSendEndpoint | null {
  if (isProduction()) {
    return { secret: required('MAIL_SEND_SECRET'), url: required('MAIL_SEND_URL') }
  }
  let url = optional('MAIL_SEND_URL')
  let secret = optional('MAIL_SEND_SECRET')
  return url === '' || secret === '' ? null : { secret, url }
}

/**
 * The most e-mails the public pages may start in a day, resends included (`02a`, _Ochrana_). A
 * value that is not a positive whole number throws, in production and outside it alike: a cap
 * that silently became no cap is the failure this exists against.
 */
export function publicMailPerDay(fallback: number): number {
  let value = optional('PUBLIC_MAIL_PER_DAY')
  if (value === '') return fallback
  let parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('PUBLIC_MAIL_PER_DAY musí být kladné celé číslo.')
  }
  return parsed
}
