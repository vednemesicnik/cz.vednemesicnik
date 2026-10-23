import { clsx } from 'clsx'
import type { AriaRole, ReactNode } from 'react'

import { ErrorIcon } from '~/components/icons/error-icon'
import { WarningIcon } from '~/components/icons/warning-icon'

import styles from './_styles.module.css'

type Tone = 'info' | 'success' | 'warning' | 'error'

type Props = {
  children: ReactNode
  tone?: Tone
  role?: AriaRole
  className?: string
}

const icons = {
  error: ErrorIcon,
  warning: WarningIcon,
} as const

/**
 * The design system's `Callout`: a note with a tinted fill and a 1px border
 * in its tone (rmridl1f). Warning and error lead with an icon, so the tone is
 * not carried by colour alone; info and success have none, and their text
 * stays directly in the note so an inline link wraps with it.
 *
 * @param props.tone - `info` by default; `success`, `warning` or `error` for
 * a note about a result.
 * @param props.role - `alert` for an error that appears after an action.
 */
export const Callout = ({
  children,
  tone = 'info',
  role,
  className,
}: Props) => {
  const Icon = tone === 'warning' || tone === 'error' ? icons[tone] : null

  return (
    <aside
      className={clsx(
        styles.callout,
        tone !== 'info' && styles[tone],
        Icon !== null && styles.hasIcon,
        className,
      )}
      role={role}
    >
      {Icon === null ? (
        children
      ) : (
        <>
          <Icon className={styles.icon} />
          <div className={styles.body}>{children}</div>
        </>
      )}
    </aside>
  )
}
