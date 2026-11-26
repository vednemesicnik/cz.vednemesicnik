import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * A `Header`'s text under the logo, centred on white.
 *
 * @param props.children - `Heading`, then `Subheading`.
 */
export const HeaderContent = ({ className, children }: Props) => (
  <section className={clsx(styles.content, className)}>{children}</section>
)
