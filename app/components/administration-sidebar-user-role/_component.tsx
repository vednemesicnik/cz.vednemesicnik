import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The signed-in user's role under the name, e.g. „Koordinátor“.
 *
 * @param props.children - The role's label
 * @returns The role
 */
export const AdministrationSidebarUserRole = ({
  children,
  className,
}: Props) => {
  return <span className={clsx(styles.role, className)}>{children}</span>
}
