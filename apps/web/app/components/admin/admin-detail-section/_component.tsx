import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  id?: string
  children: ReactNode
  className?: string
}

/**
 * A section of an administration detail page (design bbih22nt): one heading
 * level with the section's actions on its right, and a hairline between
 * sections that follow each other.
 *
 * @param props.id - The fragment a link elsewhere lands on, e.g. the author
 *   detail's Obsah (28g).
 * @param props.children - An `AdminDetailSectionTitle`, or an
 *   `AdminDetailSectionHead` with the title and `AdminDetailSectionActions`,
 *   then the content.
 */
export const AdminDetailSection = ({ id, children, className }: Props) => (
  <section className={clsx(styles.section, className)} id={id}>
    {children}
  </section>
)
