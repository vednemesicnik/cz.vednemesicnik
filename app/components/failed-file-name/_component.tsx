import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The name a `FailedFile` stands under: the PDF's name, the picked cover's.
 */
export const FailedFileName = ({ children, className }: Props) => (
  <p className={clsx(styles.fileName, className)}>{children}</p>
)
