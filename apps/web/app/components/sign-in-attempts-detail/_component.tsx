import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A small line under a `SignInAttemptsMethod`, e.g. who issued an emergency
 * link (28e).
 *
 * @param props.children - The line, e.g. „Odkaz od: Petr Dvořák“
 * @returns The detail
 */
export const SignInAttemptsDetail = ({ children, className }: Props) => {
  return <span className={clsx(styles.detail, className)}>{children}</span>
}
