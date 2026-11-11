import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useGalleryDetail } from '../gallery-detail'
import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The gallery's panel of a `GalleryDetail`, a modal `<dialog>` named by its
 * heading (24b). A file dropped beside *Přidat obrázky* is ignored rather than
 * opened by the browser in place of the editor.
 *
 * @param props.children - `GalleryDetailBar`, then `GalleryDetailBody`.
 */
export const GalleryDetailPanel = ({ className, children }: Props) => {
  const { headingId, panelRef } = useGalleryDetail()

  return (
    <dialog
      aria-labelledby={headingId}
      className={clsx(styles.panel, className)}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault()
      }}
      onDrop={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault()
      }}
      ref={panelRef}
    >
      {children}
    </dialog>
  )
}
