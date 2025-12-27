import styles from './_styles.module.css'

type Image = {
  id: string
  src: string
}

type Props = {
  className?: string
  featuredImageId?: string
  images: Image[]
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
    <section className={className}>
      <section className={styles.grid}>
        {images.map((image) => {
          const isFeatured = image.id === featuredImageId
          return (
            <section className={styles.imageWrapper} key={image.id}>
              <img
                alt={isFeatured ? 'Hlavní obrázek' : 'Obrázek'}
                className={styles.image}
                src={image.src}
              />
              {isFeatured && <span className={styles.badge}>Hlavní</span>}
            </section>
          )
        })}
      </section>
    </section>
  )
}
