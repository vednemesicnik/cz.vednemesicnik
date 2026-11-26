import { AUTH_LOG_CONFIG } from '~/config/auth-log-config'

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000

export type LastSignIn =
  | { kind: 'date'; at: Date }
  | { kind: 'never' }
  | { kind: 'not-within-retention' }

type Args = {
  lastSignInAt: Date | null
  accountCreatedAt: Date
  now: Date
}

/**
 * What the users list says about an account's last sign-in (design 28d,
 * cylr6mg1). AuthLog keeps its rows for the retention window only, so a
 * missing record means „never“ only for an account younger than that window.
 *
 * @param args - The newest `sign_in_success` (or `null`), when the account was
 *   created, and the current time.
 * @returns `date` with the sign-in; without one, `never` for an account younger
 *   than the window and `not-within-retention` for an older one.
 */
export const getLastSignIn = ({
  lastSignInAt,
  accountCreatedAt,
  now,
}: Args): LastSignIn => {
  if (lastSignInAt !== null) {
    return { at: lastSignInAt, kind: 'date' }
  }

  const accountAge = now.getTime() - accountCreatedAt.getTime()

  return accountAge < AUTH_LOG_CONFIG.retentionDays * DAY_MILLISECONDS
    ? { kind: 'never' }
    : { kind: 'not-within-retention' }
}
