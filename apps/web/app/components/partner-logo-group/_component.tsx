import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * Partner logos side by side in the order given, wrapping when they don't fit
 * (design 15g, gm5nuxml).
 *
 * @param children - The `PartnerLogo`s
 * @returns The row of logos
 */
export const PartnerLogoGroup = ({ children }: Props) => {
  return <div className={styles.group}>{children}</div>
}
