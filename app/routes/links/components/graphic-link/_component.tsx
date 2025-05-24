import { BaseLink } from "~/components/base-link"
import { Image } from "~/components/image"

import styles from "./_styles.module.css"

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
      className={styles.link}
      to={to}
      reloadDocument={true}
      aria-label={children}
    >
      <span className={styles.linkText}>{children}</span>
      {image !== undefined && (
        <div className={styles.imageFrame} aria-hidden="true">
          <div className={styles.imageWrapper}>
            <Image
              className={styles.image}
              src={image.src}
              alt={""}
              width={image.width}
              height={image.height}
            />
          </div>
        </div>
      )}
    </BaseLink>
  )
}
