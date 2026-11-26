import { clsx } from 'clsx'

import { Hyperlink } from '~/components/hyperlink'

import { formatLinkAddress } from '../../../../utils/format-link-address'
import styles from './_styles.module.css'

type Props = {
  url: string
  isValid: boolean
  className?: string
}

/**
 * An `EpisodeLinkCard`'s shortened address, which opens the platform in a new
 * tab. A draft may hold an address that isn't valid (2o0uwhgp): it then
 * stands as text.
 *
 * @param props.url - The link's whole address, shortened for the card.
 */
export const EpisodeLinkCardAddress = ({ url, isValid, className }: Props) => {
  const address = formatLinkAddress(url)

  if (!isValid) {
    return <span className={clsx(styles.address, className)}>{address}</span>
  }

  return (
    <Hyperlink
      className={clsx(styles.link, className)}
      href={url}
      rel={'noopener'}
      target={'_blank'}
    >
      <span className={styles.address}>{address}</span>
    </Hyperlink>
  )
}
