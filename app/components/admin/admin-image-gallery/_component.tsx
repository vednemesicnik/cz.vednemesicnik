import { clsx } from 'clsx'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type GalleryImage = {
  id: string
  sources: ImageSources
}

type Props = {
  className?: string
  featuredImageId: string | null
  images: GalleryImage[]
}

export const AdminImageGallery = ({
  className,
  featuredImageId,
  images,
}: Props) => {
  if (images.length === 0) {
    return null
  }

  return (
    <section className={clsx(styles.grid, className)}>
      {images.map((image) => {
        const isFeatured = image.id === featuredImageId
        if (!image.sources.src) return null
        return (
          <section className={styles.imageWrapper} key={image.id}>
            <Image
              {...image.sources}
              alt={isFeatured ? 'Hlavní obrázek' : 'Obrázek'}
              className={styles.image}
              sizes={'160px'}
            />
            {isFeatured && <span className={styles.badge}>Hlavní</span>}
          </section>
        )
      })}
    </section>
  )
}
