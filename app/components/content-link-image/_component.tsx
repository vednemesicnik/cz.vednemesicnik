import { clsx } from 'clsx'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string | undefined
  image?: ImageSources
  className?: string
}

export function ContentLinkImage({ alt, image, className }: Props) {
  return (
    <Image
      {...(image ?? {})}
      alt={alt}
      className={clsx(styles.picture, className)}
      sizes={'192px'}
    />
  )
}
