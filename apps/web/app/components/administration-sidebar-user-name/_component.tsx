import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The signed-in user's name in the sidebar's foot.
 *
 * @param props.children - The name
 * @returns The name
 */
export const AdministrationSidebarUserName = ({
  children,
  className,
}: Props) => {
  return <span className={clsx(styles.name, className)}>{children}</span>
}
