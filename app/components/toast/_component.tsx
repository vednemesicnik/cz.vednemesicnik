import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { ErrorIcon } from '~/components/icons/error-icon'

import styles from './_styles.module.css'

export type ToastTone = 'neutral' | 'error'

type Props = {
  children: ReactNode
  className?: string
  tone?: ToastTone
}

/**
 * The design system's `Toast`: a short confirmation after an action, on the
 * inverse surface, without Vrátit zpět (design 22c).
 *
 * It carries no live-region role: the region of `ToastProvider` owns the
 * announcement, because a region inserted together with its text is often not
 * read out.
 *
 * @param props.tone - `error` adds the alert icon.
 */
export const Toast = ({ children, className, tone = 'neutral' }: Props) => (
  <div className={clsx(styles.toast, className)}>
    {tone === 'error' && (
      <span aria-hidden={true} className={styles.icon}>
        <ErrorIcon />
      </span>
    )}
    <span>{children}</span>
  </div>
)
