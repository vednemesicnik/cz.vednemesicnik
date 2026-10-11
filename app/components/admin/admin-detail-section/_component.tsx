import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
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
 * @param props.title - The section heading.
 * @param props.actions - Buttons for the whole section, e.g. `Upravit profil`.
 */
export const AdminDetailSection = ({
  title,
  actions,
  children,
  className,
}: Props) => {
  const hasHead = title !== undefined || actions !== undefined

  return (
    <section className={clsx(styles.section, className)}>
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
