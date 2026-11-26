import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  className?: string
}

/**
 * The upload's indeterminate bar (`.vdm-upload__track`, design 24b,
 * bxy8xxqs): a segment sliding across the track, since an upload made with
 * `fetch` reports no progress. A `progressbar` without values, named
 * *Nahrává se*, so nothing is announced while it runs. With reduced motion
 * the segment stands still in the middle.
 */
export const UploadStatusBar = ({ className }: Props) => (
  <div
    aria-label={'Nahrává se'}
    className={clsx(styles.uploadStatusBar, className)}
    role={'progressbar'}
  >
    <div className={styles.segment} />
  </div>
)
