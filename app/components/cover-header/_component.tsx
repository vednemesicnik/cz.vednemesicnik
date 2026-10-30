import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The header of a page with a square cover, such as a podcast or an episode
 * (design 13b, 13c, lund4ssk): any child that isn't a part (the `ParentLink`)
 * on its own row above, then the `CoverHeaderCover` left of the
 * `CoverHeaderBody`, their tops in line. Below 640 px it stacks: that child,
 * the cover, the body. Without a cover there is no cover column.
 *
 * The cover is 200 px wide, 160 px below 640 px.
 *
 * @returns The header
 */
export const CoverHeader = ({ children, className }: Props) => {
  return <header className={clsx(styles.header, className)}>{children}</header>
}
