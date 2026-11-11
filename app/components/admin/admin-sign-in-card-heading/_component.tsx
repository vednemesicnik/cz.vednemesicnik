import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { VdmLogo } from '~/components/vdm-logo'
import { VdmWordmark } from '~/components/vdm-wordmark'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  wordmark?: boolean
  className?: string
}

/**
 * The heading of an `AdminSignInCard` (0zgyl1ao): the logo and the title
 * centred, the title being the page's `h1`.
 *
 * @param props.children - The title.
 * @param props.wordmark - The turning name between the logo and a smaller
 * title; only the sign-in chooser (20a, 20e, hhcprc34).
 */
export const AdminSignInCardHeading = ({
  children,
  wordmark = false,
  className,
}: Props) => {
  const title = (
    <h1 className={clsx(styles.title, wordmark && styles.wordmarkTitle)}>
      {children}
    </h1>
  )

  return (
    <div className={clsx(styles.heading, className)}>
      <VdmLogo className={styles.logo} />
      {wordmark ? (
        <div className={styles.names}>
          <p className={styles.name}>
            <VdmWordmark animate tone={'text'} />
          </p>
          {title}
        </div>
      ) : (
        title
      )}
    </div>
  )
}
