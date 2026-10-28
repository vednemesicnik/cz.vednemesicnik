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
  /**
   * A refused pick's sentence under the field (26d): the field takes the error
   * look and the sentence describes it.
   */
  errorId?: string
  /**
   * The slot a cover's field keeps: a printed page's proportions for an
   * issue's (26c), a square for a podcast's (27e). Without it the field is as
   * tall as its text, as the PDF's.
   */
  shape?: 'page' | 'square'
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
  errorId,
  shape,
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
    event.dataTransfer.dropEffect = isDisabled ? 'none' : 'copy'
    if (isDisabled) return
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
        shape === 'page' && styles.page,
        shape === 'square' && styles.square,
        errorId !== undefined && styles.invalid,
        isDragOver && styles.dragOver,
      )}
    >
      <input
        accept={accept}
        aria-describedby={clsx(hintId, errorId)}
        aria-disabled={isDisabled || undefined}
        aria-invalid={errorId !== undefined || undefined}
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
