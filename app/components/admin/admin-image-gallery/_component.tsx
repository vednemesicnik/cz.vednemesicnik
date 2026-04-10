import { clsx } from 'clsx'
import { Image } from '~/components/image'
import styles from './_styles.module.css'

type ImageData = {
  id: string
  src: string | undefined
}

type Props = {
  className?: string
  featuredImageId: string | null
  images: ImageData[]
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
        if (!image.src) return null
        return (
          <section className={styles.imageWrapper} key={image.id}>
            <Image
              alt={isFeatured ? 'Hlavní obrázek' : 'Obrázek'}
              className={styles.image}
              height={120}
              src={image.src}
              width={160}
            />
            {isFeatured && <span className={styles.badge}>Hlavní</span>}
          </section>
        )
      })}
    </section>
  )
}
