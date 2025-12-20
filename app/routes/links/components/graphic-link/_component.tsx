import { BaseLink } from '~/components/base-link'
import { Image } from '~/components/image'

import styles from './_styles.module.css'

type Props = {
  children: string
  to: string
  image?: {
    src: string
    width: number
    height: number
  }
}

export const GraphicLink = ({ children, to, image }: Props) => {
  return (
    <BaseLink
      aria-label={children}
      className={styles.link}
      reloadDocument={true}
      to={to}
    >
      <span className={styles.linkText}>{children}</span>
      {image !== undefined && (
        <div aria-hidden="true" className={styles.imageFrame}>
          <div className={styles.imageWrapper}>
            <Image
              alt={''}
              className={styles.image}
              height={image.height}
              src={image.src}
              width={image.width}
            />
          </div>
        </div>
      )}
    </BaseLink>
  )
}
