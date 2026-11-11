import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The design system's `AdminSignInCard` (0zgyl1ao), the card of every sign-in
 * screen (design 20): the logo and the title centred, then the content 16 px
 * apart, on a 400 px card. Under 768 px there is no card: the content stands
 * on the white page (20e). The sign-in layout centres it on the page, with the
 * website link under it (s21ljh49).
 *
 * @param props.children - The `AdminSignInCardHeading`, then text, the button,
 *   a link.
 */
export const AdminSignInCard = ({ children, className }: Props) => (
  <section className={clsx(styles.card, className)}>{children}</section>
)
