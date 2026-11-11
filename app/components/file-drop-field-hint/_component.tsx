import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useFileDropField } from '~/components/file-drop-field'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The line under a `FileDropField`'s call, read with its input as its
 * description.
 *
 * @param props.children - The hint, e.g. „nebo ji sem přetáhněte · obrázek do 5 MB“
 * @returns The hint's `<span>`
 */
export const FileDropFieldHint = ({ children, className }: Props) => {
  const { hintId } = useFileDropField()

  return (
    <span className={clsx(styles.hint, className)} id={hintId}>
      {children}
    </span>
  )
}
