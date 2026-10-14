import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { VdmLogo } from '~/components/vdm-logo'
import { VdmWordmark } from '~/components/vdm-wordmark'

import styles from './_styles.module.css'

type Props = {
  title: string
  wordmark?: boolean
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
 * @param props.wordmark - The turning name between the logo and a smaller
 * title; only the sign-in chooser (20a, 20e, hhcprc34).
 * @param props.children - Text, the button, a link.
 */
export const AdminSignInCard = ({
  title,
  wordmark = false,
  children,
  className,
}: Props) => {
  const heading = (
    <h1 className={clsx(styles.title, wordmark && styles.wordmarkTitle)}>
      {title}
    </h1>
  )

  return (
    <div className={styles.page}>
      <section className={clsx(styles.card, className)}>
        <div className={styles.heading}>
          <VdmLogo className={styles.logo} />
          {wordmark ? (
            <div className={styles.names}>
              <p className={styles.name}>
                <VdmWordmark animate tone={'text'} />
              </p>
              {heading}
            </div>
          ) : (
            heading
          )}
        </div>
        {children}
      </section>
    </div>
  )
}
