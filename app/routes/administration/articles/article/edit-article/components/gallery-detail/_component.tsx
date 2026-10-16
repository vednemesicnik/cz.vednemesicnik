import { clsx } from 'clsx'
import { type ReactNode, useEffect, useId, useRef } from 'react'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Props = {
  /** The row's value on a phone (24f): „3 · ve zpracování: 1“. */
  summary: string
  isOpen: boolean
  /** Another detail is open over it: out of reach (24f). */
  isInert: boolean
  onOpen: () => void
  onClose: () => void
  /** The editor's save line, under the panel's name (24b, 940ikr3o). */
  saveLine: ReactNode
  /** The column's compact tiles and *Přidat obrázky* (24a). */
  preview: ReactNode
  /** The gallery: the full tiles, in the panel only. */
  children: ReactNode
}

/**
 * The article editor's *Obrázky* (design 24a, 24b, 8kfn4ou3). In the column,
 * the heading with *Upravit* and the compact tiles; on a phone, a row with the
 * count. Both open the gallery as a panel at every width: over the editor, at
 * most 976 px wide, with a dimmed backdrop out of reach; under 768 px over the
 * whole screen (24f). The panel stays in the form while closed, so its fields
 * save with it. Focus goes to its name; Esc and *Hotovo* close it and give the
 * focus back to what opened it.
 */
export const GalleryDetail = ({
  summary,
  isOpen,
  isInert,
  onOpen,
  onClose,
  saveLine,
  preview,
  children,
}: Props) => {
  const headingId = useId()
  const panelRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const panel = panelRef.current
    if (panel === null) return

    if (isOpen && !panel.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      panel.showModal()
      headingRef.current?.focus()
    } else if (!isOpen && panel.open) {
      panel.close()
    }
  }, [isOpen])

  // Esc and any other native close: native listeners, as React's onClose does
  // not fire reliably on <dialog>.
  useEffect(() => {
    const panel = panelRef.current
    if (panel === null) return

    const handleClose = () => {
      onCloseRef.current()
      openerRef.current?.focus()
      openerRef.current = null
    }

    panel.addEventListener('close', handleClose)
    return () => panel.removeEventListener('close', handleClose)
  }, [])

  return (
    <section className={styles.galleryDetail} inert={isInert}>
      <button
        aria-haspopup={'dialog'}
        className={styles.row}
        onClick={onOpen}
        type={'button'}
      >
        <span className={styles.rowName}>Obrázky</span>
        <span className={styles.rowValue}>{summary}</span>
      </button>

      <div className={styles.column}>
        <div className={styles.columnHeading}>
          <h2 className={styles.name}>Obrázky</h2>
          <Button
            aria-haspopup={'dialog'}
            aria-label={'Upravit obrázky'}
            onClick={onOpen}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Upravit
          </Button>
        </div>
        {preview}
      </div>

      {/* A file dropped beside *Přidat obrázky* is ignored rather than
          opened by the browser in place of the editor. */}
      <dialog
        aria-labelledby={headingId}
        className={styles.panel}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes('Files')) event.preventDefault()
        }}
        onDrop={(event) => {
          if (event.dataTransfer.types.includes('Files')) event.preventDefault()
        }}
        ref={panelRef}
      >
        <div className={styles.bar}>
          <div className={styles.barTitle}>
            <h2
              className={clsx(styles.name, styles.panelName)}
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
            >
              Obrázky
            </h2>
            <div className={styles.saveLine}>{saveLine}</div>
          </div>
          <Button
            onClick={() => panelRef.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            Hotovo
          </Button>
        </div>
        <div className={styles.body}>{children}</div>
      </dialog>
    </section>
  )
}
