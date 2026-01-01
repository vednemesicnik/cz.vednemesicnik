import { Image } from '~/components/image'
import styles from './_styles.module.css'

type Props = {
  alt: string
  src: string
}

export function ContentLinkImage({ alt, src }: Props) {
  return (
    <Image
      alt={alt}
      className={styles.picture}
      height={108}
      src={src}
      width={192}
    />
  )
}
