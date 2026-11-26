import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The name over the role, beside the avatar in `AdministrationSidebarUser`.
 *
 * @param props.children - The `AdministrationSidebarUserName` and the role
 * @returns The text column
 */
export const AdministrationSidebarUserText = ({
  children,
  className,
}: Props) => {
  return <span className={clsx(styles.text, className)}>{children}</span>
}
