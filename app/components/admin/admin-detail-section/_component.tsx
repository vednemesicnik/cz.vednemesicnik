import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  id?: string
  title?: string
  actions?: ReactNode
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
 * @param props.title - The section heading.
 * @param props.actions - Buttons for the whole section, e.g. `Upravit profil`.
 */
export const AdminDetailSection = ({
  id,
  title,
  actions,
  children,
  className,
}: Props) => {
  const hasHead = title !== undefined || actions !== undefined

  return (
    <section className={clsx(styles.section, className)} id={id}>
      {hasHead && (
        <div className={styles.head}>
          {title !== undefined && <h2 className={styles.title}>{title}</h2>}
          {actions !== undefined && (
            <div className={styles.actions}>{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
