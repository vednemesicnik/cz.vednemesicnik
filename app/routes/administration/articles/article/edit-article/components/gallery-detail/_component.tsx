import { clsx } from 'clsx'
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react'

import styles from './_styles.module.css'

type GalleryDetailContextValue = {
  headingId: string
  headingRef: RefObject<HTMLHeadingElement | null>
  panelRef: RefObject<HTMLDialogElement | null>
  onOpen: () => void
}

const Context = createContext<GalleryDetailContextValue | undefined>(undefined)

type Props = {
  isOpen: boolean
  /** Another detail is open over it: out of reach (24f). */
  isInert: boolean
  onOpen: () => void
  onClose: () => void
  className?: string
  children: ReactNode
}

/**
 * The article editor's *Obrázky* (design 24a, 24b, 8kfn4ou3). In the column,
 * the heading with *Upravit* and the compact tiles; on a phone, a row with up
 * to three thumbnails and the count (u94oosdp). Both open the gallery as a panel at every width: over the editor, at
 * most 976 px wide, with a dimmed backdrop out of reach; under 768 px over the
 * whole screen (24f). The panel stays in the form while closed, so its fields
 * save with it. Focus goes to its name; Esc and *Hotovo* close it and give the
 * focus back to what opened it.
 *
 * @param props.children - `GalleryDetailSummary`, `GalleryDetailColumn`, then
 *   `GalleryDetailPanel`.
 */
export const GalleryDetail = ({
  isOpen,
  isInert,
  onOpen,
  onClose,
  className,
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
    <section className={clsx(styles.galleryDetail, className)} inert={isInert}>
      <Context.Provider value={{ headingId, headingRef, onOpen, panelRef }}>
        {children}
      </Context.Provider>
    </section>
  )
}

/**
 * What a `GalleryDetail` shares with its parts: opening it, the panel and its
 * heading.
 *
 * @returns The gallery detail's context
 */
export const useGalleryDetail = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useGalleryDetail must be used within a GalleryDetail')
  }

  return context
}
