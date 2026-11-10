import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  isFailure?: boolean
  className?: string
}

/**
 * One attempt in `SignInAttempts`: its `SignInAttemptsTime`, then its
 * `SignInAttemptsMethod`.
 *
 * @param props.children - The time and the method
 * @param props.isFailure - A failed attempt, rose in both cells (29a); its
 *   label says so too
 * @returns The list item
 */
export const SignInAttemptsItem = ({
  children,
  isFailure = false,
  className,
}: Props) => {
  return (
    <li className={clsx(styles.item, isFailure && styles.failure, className)}>
      {children}
    </li>
  )
}
