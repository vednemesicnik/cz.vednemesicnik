import { clsx } from 'clsx'
import { type DragEvent, useId, useState } from 'react'

import styles from './_styles.module.css'

type Props = {
  onFiles: (files: File[]) => void
  /** The narrow column's tile: the label alone, no dropping (24a). */
  isCompact?: boolean
  disabled?: boolean
  className?: string
}

const hasFiles = (event: DragEvent) =>
  event.dataTransfer.types.includes('Files')

/**
 * The gallery's dashed *Přidat obrázky* tile (design 24a, 24b): it opens the
 * file picker, several images at once; in the panel the files can also be
 * dropped on it.
 */
export const AddImagesTile = ({
  onFiles,
  isCompact = false,
  disabled = false,
  className,
}: Props) => {
  const inputId = useId()
  const hintId = useId()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (event: DragEvent<HTMLLIElement>) => {
    if (isCompact || disabled || !hasFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDrop = (event: DragEvent<HTMLLIElement>) => {
    if (isCompact || disabled || !hasFiles(event)) return
    event.preventDefault()
    setIsDragOver(false)
    onFiles([...event.dataTransfer.files])
  }

  return (
    <li
      className={clsx(
        styles.addImagesTile,
        isCompact && styles.compact,
        isDragOver && styles.dragOver,
        className,
      )}
      onDragLeave={() => setIsDragOver(false)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        accept={'image/*'}
        aria-describedby={isCompact ? undefined : hintId}
        className={styles.input}
        disabled={disabled}
        // Its pick goes to the gallery, never with the form's save.
        form={''}
        id={inputId}
        multiple
        onChange={(event) => {
          onFiles([...(event.currentTarget.files ?? [])])
          // The same file can be picked again.
          event.currentTarget.value = ''
        }}
        type={'file'}
      />
      <label className={styles.label} htmlFor={inputId}>
        Přidat obrázky
      </label>
      {!isCompact && (
        <span className={styles.hint} id={hintId}>
          nebo je sem přetáhněte · nejvýš 10 MB na obrázek
        </span>
      )}
    </li>
  )
}
