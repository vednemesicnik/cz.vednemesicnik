import { clsx } from 'clsx'
import { type ChangeEvent, type DragEvent, useId, useState } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** „Vybrat obálku“, „Vybrat PDF“. */
  label: string
  /** „nebo ji sem přetáhněte · obrázek do 5 MB“. */
  hint: string
  accept: string
  /** A picked or dropped file; it uploads at once (26c). */
  onPick: (file: File) => void
  /** Outside the edit hold nothing uploads. */
  isDisabled?: boolean
  /** A pick was refused: the field in the error look, the sentence under it. */
  isInvalid?: boolean
  /** The cover's field has a printed page's proportions (26c). */
  isPage?: boolean
}

/**
 * The dashed field a cover or a PDF is picked or dropped into (design 26c, as
 * the gallery's tile in 24b). A pick uploads at once; it is no part of the
 * form's save. Without the edit hold it is `aria-disabled`, not `disabled`,
 * so it keeps its place in the focus order and a screen reader says it is
 * unavailable.
 */
export const FileDropField = ({
  label,
  hint,
  accept,
  onPick,
  isDisabled = false,
  isInvalid = false,
  isPage = false,
}: Props) => {
  const inputId = useId()
  const hintId = useId()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    // The same file picked again still changes.
    event.currentTarget.value = ''
    if (file !== undefined && !isDisabled) onPick(file)
  }

  // A file dropped here would otherwise open in the tab and leave the editor.
  const handleDragOver = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    if (isDisabled) return
    event.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }
  const handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file !== undefined && !isDisabled) onPick(file)
  }

  return (
    <div
      className={clsx(
        styles.field,
        isPage && styles.page,
        isInvalid && styles.invalid,
        isDragOver && styles.dragOver,
      )}
    >
      <input
        accept={accept}
        aria-describedby={hintId}
        aria-disabled={isDisabled || undefined}
        className={styles.input}
        // A pick saves on its own, never with the form's save.
        form={''}
        id={inputId}
        onChange={handleChange}
        onClick={(event) => {
          if (isDisabled) event.preventDefault()
        }}
        type={'file'}
      />
      {/* Its box covers the field, so a drop anywhere lands here. */}
      <label
        className={clsx(styles.label, isDisabled && styles.disabled)}
        htmlFor={inputId}
        onDragLeave={() => setIsDragOver(false)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {label}
      </label>
      <span className={styles.hint} id={hintId}>
        {hint}
      </span>
    </div>
  )
}
