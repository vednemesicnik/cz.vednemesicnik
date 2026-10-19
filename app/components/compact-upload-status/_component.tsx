import { clsx } from 'clsx'

import { UploadStatusBar } from '~/components/upload-status-bar'

import styles from './_styles.module.css'

type Props = {
  className?: string
}

/**
 * `UploadStatus compact`: the narrow column's tile (design 24a, bxy8xxqs)
 * gets the word and a thinner bar in place of its alt line, without
 * *Zrušit*: a pick opens the panel, where it is cancelled. It announces
 * nothing; the panel's row does.
 */
export const CompactUploadStatus = ({ className }: Props) => (
  <div className={clsx(styles.compactUploadStatus, className)}>
    <span className={styles.label}>Nahrává se</span>
    <UploadStatusBar className={styles.bar} />
  </div>
)
