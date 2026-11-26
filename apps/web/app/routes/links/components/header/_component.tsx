import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The links page's header: a white band over the logo, then the name and
 * the slogan.
 *
 * @param props.children - `HeaderLogo`, then `HeaderContent`.
 */
export const Header = ({ className, children }: Props) => (
  <header className={clsx(styles.container, className)}>
    <div className={styles.blockDivider} />
    {children}
  </header>
)
