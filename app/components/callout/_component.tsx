import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Tone = 'info' | 'success' | 'warning' | 'error'

type Props = {
  children: ReactNode
  tone?: Tone
  className?: string
}

/**
 * The design system's `Callout`: a note with a coloured leading border.
 *
 * @param props.tone - `info` by default; `success`, `warning` or `error` for
 * a note about a result.
 */
export const Callout = ({ children, tone = 'info', className }: Props) => {
  return (
    <aside
      className={clsx(
        styles.callout,
        tone !== 'info' && styles[tone],
        className,
      )}
    >
      {children}
    </aside>
  )
}
