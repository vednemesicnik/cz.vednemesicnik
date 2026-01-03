import { clsx } from 'clsx'
import { Image } from '~/components/image'
import styles from './_styles.module.css'

type Props = {
  alt: string | undefined
  src: string | undefined
  className?: string
}

export function ContentLinkImage({ alt, src, className }: Props) {
  return (
    <Image
      alt={alt}
      className={clsx(styles.picture, className)}
      height={108}
      src={src}
      width={192}
    />
  )
}
