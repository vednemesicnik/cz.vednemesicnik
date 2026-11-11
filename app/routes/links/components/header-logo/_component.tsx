import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * A `Header`'s logo, between two white bands, so the page's background shows
 * through the logo only.
 *
 * @param props.children - The logo, e.g. `VdmLogoClip`.
 */
export const HeaderLogo = ({ className, children }: Props) => (
  <section className={clsx(styles.logo, className)}>
    <div className={styles.logoDivider} />
    {children}
    <div className={styles.logoDivider} />
  </section>
)
