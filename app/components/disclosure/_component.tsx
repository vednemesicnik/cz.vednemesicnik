import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A closed native `<details>` for what only some readers need: a
 * `DisclosureSummary`, then a `DisclosureContent` (design candidate, 15f,
 * wnyfw8po). Keyboard, screen readers and find in page work without script;
 * it starts closed and remembers nothing.
 */
export const Disclosure = ({ children, className }: Props) => {
  return (
    <details className={clsx(styles.disclosure, className)}>{children}</details>
  )
}
