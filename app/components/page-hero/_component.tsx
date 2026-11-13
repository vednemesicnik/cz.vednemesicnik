import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The band at the top of a landing page: a lava lamp of blurred signature
 * colours with white text on it (15f, tfma8scr). The light lava glows only in
 * the band's bottom padding, under the text; see the stylesheet.
 *
 * @param props.children - Its `PageHeroEyebrow`, `PageHeroHeadline` and
 *   `PageHeroSubheadline`
 */
export const PageHero = ({ children }: Props) => {
  return (
    <section className={styles.pageHero} data-page-hero>
      {children}
      <div aria-hidden={true} className={styles.glow} />
    </section>
  )
}
