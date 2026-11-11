import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The signed-in user in the sidebar's foot: the avatar, then an
 * `AdministrationSidebarUserText` with the name and the role.
 *
 * @param props.children - The avatar and the text
 * @returns The user's row
 */
export const AdministrationSidebarUser = ({ children, className }: Props) => {
  return <div className={clsx(styles.user, className)}>{children}</div>
}
