import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { VdmLogo } from '~/components/vdm-logo'

import styles from './_styles.module.css'

type Props = {
  title: string
  // What the title is about, kept with it under the logo (e.g. „Účet: …“).
  details?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * The sign-in card of design 20 (drawn in 20f): the logo and the title
 * centred, then the card's content 16 px apart, on a 400 px card. On a phone
 * there is no card: the content stands on the white page, full width (20e).
 *
 * @param props.title - The card's heading, the page's `h1`.
 * @param props.details - Lines that belong to the title, in its group.
 * @param props.children - The rest: text, the button, a link.
 */
export const AdminSignInCard = ({
  title,
  details,
  children,
  className,
}: Props) => (
  <div className={styles.page}>
    <section className={clsx(styles.card, className)}>
      <div className={styles.heading}>
        <VdmLogo className={styles.logo} />
        <h1 className={styles.title}>{title}</h1>
        {details}
      </div>
      {children}
    </section>
  </div>
)
