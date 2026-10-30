import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The header of a page with a square cover, such as a podcast or an episode
 * (design 13b, 13c): the `CoverHeaderCover` left of the `CoverHeaderBody`, and
 * any other child (the `ParentLink`) above the body. Below 640 px it stacks:
 * that child, the cover, the body. Without a cover there is no cover column.
 *
 * The cover is 200 px wide, 160 px below 640 px; a page sets
 * `--cover-header-cover-size` for another width.
 *
 * @returns The header
 */
export const CoverHeader = ({ children, className }: Props) => {
  return <header className={clsx(styles.header, className)}>{children}</header>
}
