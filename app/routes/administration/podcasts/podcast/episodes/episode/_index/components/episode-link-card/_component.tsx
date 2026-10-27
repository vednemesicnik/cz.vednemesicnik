import { Hyperlink } from '~/components/hyperlink'

import { formatLinkAddress } from '../../../../utils/format-link-address'
import styles from './_styles.module.css'

type Props = {
  platform: string
  url: string
  isValid: boolean
}

/**
 * One link of the episode on its detail (design 27c): the platform's name and
 * the shortened address, which opens the platform in a new tab. A draft may
 * hold an address that isn't valid (2o0uwhgp) or a link without its platform's
 * name yet: the address then stands as text, and the name is left out.
 */
export const EpisodeLinkCard = ({ platform, url, isValid }: Props) => {
  const address = formatLinkAddress(url)

  return (
    <li className={styles.card}>
      {platform !== '' && <span className={styles.platform}>{platform}</span>}
      {isValid ? (
        <Hyperlink
          className={styles.link}
          href={url}
          rel={'noopener'}
          target={'_blank'}
        >
          <span className={styles.address}>{address}</span>
        </Hyperlink>
      ) : (
        <span className={styles.address}>{address}</span>
      )}
    </li>
  )
}
