import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { EditorDetailRow } from '~/components/editor-detail-row'
import { EditorDetailRowName } from '~/components/editor-detail-row-name'
import { EditorDetailRowValue } from '~/components/editor-detail-row-value'

import { useGalleryDetail } from '../gallery-detail'
import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The phone's row of a `GalleryDetail` (24f): *Obrázky* and its value, as the
 * button that opens the gallery.
 *
 * @param props.children - The value: up to three thumbnails
 *   (`EditorDetailRowThumbnails`), then the count, „4 · nahrává se: 1“
 *   (u94oosdp).
 */
export const GalleryDetailSummary = ({ className, children }: Props) => {
  const { onOpen } = useGalleryDetail()

  return (
    <EditorDetailRow
      aria-haspopup={'dialog'}
      className={clsx(styles.row, className)}
      onClick={onOpen}
    >
      <EditorDetailRowName>Obrázky</EditorDetailRowName>
      <EditorDetailRowValue>{children}</EditorDetailRowValue>
    </EditorDetailRow>
  )
}
