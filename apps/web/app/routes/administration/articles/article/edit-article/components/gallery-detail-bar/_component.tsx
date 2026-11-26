import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Button } from '~/components/button'

import { useGalleryDetail } from '../gallery-detail'
import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The bar of a `GalleryDetailPanel`, sticky over the gallery: *Obrázky* as
 * the panel's heading, the save line under it, and *Hotovo*, which closes the
 * panel.
 *
 * @param props.children - The editor's save line (24b, 940ikr3o).
 */
export const GalleryDetailBar = ({ className, children }: Props) => {
  const { headingId, headingRef, panelRef } = useGalleryDetail()

  return (
    <div className={clsx(styles.bar, className)}>
      <div className={styles.barTitle}>
        <h2
          className={styles.name}
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
        >
          Obrázky
        </h2>
        <div className={styles.saveLine}>{children}</div>
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
  )
}
