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
 * The column's *Obrázky* of a `GalleryDetail` (24a): the heading with
 * *Upravit*, which opens the gallery, over the compact tiles. Hidden on a
 * phone, where the row stands in for it.
 *
 * @param props.children - The compact tiles and *Přidat obrázky*.
 */
export const GalleryDetailColumn = ({ className, children }: Props) => {
  const { onOpen } = useGalleryDetail()

  return (
    <div className={clsx(styles.column, className)}>
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
      {children}
    </div>
  )
}
