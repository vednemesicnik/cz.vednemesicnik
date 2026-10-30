import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The editorial preview bar under the public header (10d): one line, the
 * `PreviewBarMessage` on the left and one action on the right, a `Link`
 * or a `ButtonLink`. `PreviewBarWide` and `PreviewBarNarrow` carry the
 * phone's shorter words. Rendering it grows `--app-header-height` by its
 * height, so what sticks under the header stays under the bar.
 */
export const PreviewBar = ({ children }: Props) => (
  <div className={styles.bar} data-preview-bar={''} role={'note'}>
    {children}
  </div>
)
