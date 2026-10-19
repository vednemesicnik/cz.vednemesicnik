import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The thumbnails before an `EditorDetailRow`'s value (24f, u94oosdp): at most
 * three `EditorDetailRowThumbnail`s. Hidden from a screen reader, which hears
 * the count in the value.
 */
export const EditorDetailRowThumbnails = ({ children, className }: Props) => (
  <span
    aria-hidden={true}
    className={clsx(styles.editorDetailRowThumbnails, className)}
  >
    {children}
  </span>
)
