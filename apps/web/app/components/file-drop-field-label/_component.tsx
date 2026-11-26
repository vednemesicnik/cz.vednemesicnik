import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useFileDropField } from '~/components/file-drop-field'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A `FileDropField`'s call to pick a file. Its box covers the field, so a
 * click or a drop anywhere on it lands here.
 *
 * @param props.children - The call, e.g. „Vybrat obálku“, „Vybrat PDF“
 * @returns The `<label>`
 */
export const FileDropFieldLabel = ({ children, className }: Props) => {
  const { inputId, isDisabled, onDragLeave, onDragOver, onDrop } =
    useFileDropField()

  return (
    <label
      className={clsx(styles.label, isDisabled && styles.disabled, className)}
      htmlFor={inputId}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
    </label>
  )
}
