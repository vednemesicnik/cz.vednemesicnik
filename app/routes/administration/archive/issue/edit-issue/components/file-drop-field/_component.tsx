import { clsx } from 'clsx'
import { type DragEvent, type MouseEvent, useId } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** „Vybrat obálku“, „Vybrat PDF“. */
  label: string
  /** „nebo ji sem přetáhněte · obrázek do 5 MB“. */
  hint: string
  accept: string
  /** The cover's field has a printed page's proportions (26c). */
  isPage?: boolean
}

// A file dropped here would otherwise open in the tab and leave the editor.
const keepDropInPage = (event: DragEvent) => {
  if (event.dataTransfer.types.includes('Files')) event.preventDefault()
}

// The picker waits for the uploads (#711).
const keepPickerClosed = (event: MouseEvent) => event.preventDefault()

/**
 * The dashed field a cover or a PDF is picked or dropped into (design 26c, as
 * the gallery's tile in 24b). Uploading on pick comes with #711; until then the
 * picker stays closed. It is `aria-disabled`, not `disabled`, so it keeps its
 * place in the focus order and a screen reader says it is unavailable.
 */
export const FileDropField = ({
  label,
  hint,
  accept,
  isPage = false,
}: Props) => {
  const inputId = useId()
  const hintId = useId()

  return (
    <div className={clsx(styles.field, isPage && styles.page)}>
      <input
        accept={accept}
        aria-describedby={hintId}
        aria-disabled={true}
        className={styles.input}
        // A pick saves on its own, never with the form's save.
        form={''}
        id={inputId}
        onClick={keepPickerClosed}
        type={'file'}
      />
      {/* Its box covers the field, so a drop anywhere lands here. */}
      <label
        className={styles.label}
        htmlFor={inputId}
        onDragOver={keepDropInPage}
        onDrop={keepDropInPage}
      >
        {label}
      </label>
      <span className={styles.hint} id={hintId}>
        {hint}
      </span>
    </div>
  )
}
