import { CopyButton } from '~/components/copy-button'

import styles from './_styles.module.css'

type Props = {
  children: string
}

/**
 * The feed's address in `FeedCard`, under *Adresa pro čtečku* (17a). It is a
 * `CopyButton`, not a link: opened in a browser the feed shows raw XML, and
 * copying is what the reader needs. The address shows whole, with `https://`,
 * and breaks anywhere so a long podcast id can't stretch the card.
 *
 * @param props.children - The feed's absolute address, shown and copied.
 * @returns The labelled address
 */
export const FeedCardAddress = ({ children }: Props) => {
  return (
    <div className={styles.address}>
      <span className={styles.label}>Adresa pro čtečku</span>
      <span>
        <CopyButton value={children}>
          <span className={styles.value}>{children}</span>
        </CopyButton>
      </span>
    </div>
  )
}
