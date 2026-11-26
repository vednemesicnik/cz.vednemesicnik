import { BaseLink } from '~/components/base-link'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  children: string
  to: string
  image?: ImageSources
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
      {image?.src !== undefined && (
        <div aria-hidden="true" className={styles.imageFrame}>
          <div className={styles.imageWrapper}>
            <Image
              {...image}
              alt={''}
              className={styles.image}
              sizes={'320px'}
            />
          </div>
        </div>
      )}
    </BaseLink>
  )
}
