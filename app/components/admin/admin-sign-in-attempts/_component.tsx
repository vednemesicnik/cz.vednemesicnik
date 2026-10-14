import { clsx } from 'clsx'

import type { SignInAttempt } from '~/utils/sign-in-attempts/to-sign-in-attempt'

import styles from './_styles.module.css'

type Props = {
  attempts: SignInAttempt[]
  className?: string
}

/**
 * The last sign-in attempts of an account, newest first (design 29a, 28e): a
 * 128 px column with the date and time, then the method, which may wrap, and
 * small under it who issued an emergency link. A failed attempt is rose and
 * says so in its label.
 *
 * @param props.attempts - The attempts from `getRecentSignInAttempts`.
 */
export const AdminSignInAttempts = ({ attempts, className }: Props) => {
  return (
    <ol className={clsx(styles.list, className)}>
      {attempts.map((attempt) => (
        <li
          className={clsx(styles.attempt, attempt.isFailure && styles.failure)}
          key={attempt.id}
        >
          <time dateTime={attempt.dateTime}>{attempt.formattedDateTime}</time>
          <span className={styles.method}>
            {attempt.label}
            {attempt.detail !== null && (
              <span className={styles.detail}>{attempt.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}
