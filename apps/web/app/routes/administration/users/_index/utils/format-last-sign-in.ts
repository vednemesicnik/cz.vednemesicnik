import { AUTH_LOG_CONFIG } from '~/config/auth-log-config'
import { formatNumericDateOrToday } from '~/utils/format-numeric-date-or-today'

import type { LastSignIn } from './get-last-sign-in'

/**
 * An account's last sign-in as the users list says it (design 28d,
 * cylr6mg1, sdyic0se).
 *
 * @param lastSignIn - From `getLastSignIn`.
 * @param now - The current time, which decides „dnes“.
 * @returns `25. 9. 2026` or `dnes`, `zatím nikdy`, or `90 dní bez přihlášení`.
 */
export const formatLastSignIn = (lastSignIn: LastSignIn, now: Date) => {
  switch (lastSignIn.kind) {
    case 'date':
      return formatNumericDateOrToday(lastSignIn.at, now)
    case 'never':
      return 'zatím nikdy'
    case 'not-within-retention':
      return `${AUTH_LOG_CONFIG.retentionDays} dní bez přihlášení`
  }
}
