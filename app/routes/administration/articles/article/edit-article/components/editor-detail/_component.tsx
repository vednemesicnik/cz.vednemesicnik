import { clsx } from 'clsx'
import { type ReactNode, useEffect, useId, useRef } from 'react'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Props = {
  /** The detail's name: its heading, its row and its panel's title. */
  name: string
  /** The row's value on a phone, `—` when empty (24f). */
  summary: string
  /** The field's own label names it on wider screens, so no heading there. */
  isNameHidden?: boolean
  isOpen: boolean
  /** Another detail is open over it: out of reach (24f). */
  isInert: boolean
  onOpen: () => void
  onClose: () => void
  /** The editor's save line, under the open panel's name (24f, 940ikr3o). */
  saveLine: ReactNode
  children: ReactNode
}

/**
 * One detail of the article editor's right column (design 24a). On a phone it
 * is a row with its value that opens the detail over the whole screen, with
 * the save line and *Hotovo*, which only closes (24f). One section in both, so
 * its fields exist once in the form; the structure is fixed, hence props.
 */
export const EditorDetail = ({
  name,
  summary,
  isNameHidden = false,
  isOpen,
  isInert,
  onOpen,
  onClose,
  saveLine,
  children,
}: Props) => {
  const panelId = useId()
  const headingId = useId()
  const rowRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const wasOpenRef = useRef(false)

  // Opening moves to the panel's name, closing back to the row.
  useEffect(() => {
    if (isOpen) {
      headingRef.current?.focus()
    } else if (wasOpenRef.current) {
      rowRef.current?.focus()
    }
    wasOpenRef.current = isOpen
  }, [isOpen])

  return (
    <section
      className={clsx(styles.detail, isOpen && styles.isOpen)}
      inert={isInert}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className={styles.row}
        onClick={onOpen}
        ref={rowRef}
        type={'button'}
      >
        <span className={styles.rowName}>{name}</span>
        <span className={styles.rowValue}>{summary}</span>
      </button>

      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the role is set, dialog or group, both named by the heading */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: as above; Esc closes the open panel */}
      <div
        aria-labelledby={headingId}
        aria-modal={isOpen || undefined}
        className={styles.panel}
        id={panelId}
        onKeyDown={(event) => {
          if (isOpen && event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }
        }}
        // A labelled group beside the text, a dialog over it on a phone.
        role={isOpen ? 'dialog' : 'group'}
      >
        <div className={clsx(styles.bar, isNameHidden && styles.isNameHidden)}>
          <div className={styles.barTitle}>
            <h2
              className={styles.name}
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
            >
              {name}
            </h2>
            <div className={styles.saveLine}>{saveLine}</div>
          </div>
          <Button
            className={styles.done}
            onClick={onClose}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            Hotovo
          </Button>
        </div>
        {children}
      </div>
    </section>
  )
}
