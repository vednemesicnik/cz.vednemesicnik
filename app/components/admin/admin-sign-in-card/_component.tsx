import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { VdmLogo } from '~/components/vdm-logo'

import styles from './_styles.module.css'

type Props = {
  title: string
  children?: ReactNode
  className?: string
}

/**
 * The design system's `AdminSignInCard` (0zgyl1ao), the card of every sign-in
 * screen (design 20): the logo and the title centred, then the content 16 px
 * apart, on a 400 px card. Under 768 px there is no card: the content stands
 * on the white page (20e).
 *
 * @param props.title - The card's heading, the page's `h1`.
 * @param props.children - Text, the button, a link.
 */
export const AdminSignInCard = ({ title, children, className }: Props) => (
  <div className={styles.page}>
    <section className={clsx(styles.card, className)}>
      <div className={styles.heading}>
        <VdmLogo className={styles.logo} />
        <h1 className={styles.title}>{title}</h1>
      </div>
      {children}
    </section>
  </div>
)
