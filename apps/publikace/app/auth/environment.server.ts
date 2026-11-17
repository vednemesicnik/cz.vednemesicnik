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
