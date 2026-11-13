import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Headline } from '~/components/headline'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The page headline inside a PageHero: the Headline's size and line height, but
 * white, because the band under it already carries the gradient (tfma8scr).
 */
export const PageHeroHeadline = ({ children, className }: Props) => {
  return (
    <Headline className={clsx(styles.headline, className)}>{children}</Headline>
  )
}
