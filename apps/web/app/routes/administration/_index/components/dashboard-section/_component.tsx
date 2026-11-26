import { type ReactNode, useId } from 'react'

import styles from './_styles.module.css'
import { DashboardSectionContext } from './dashboard-section-context'

type Props = {
  children: ReactNode
}

/**
 * One section of the dashboard (design 21a, 21b): its heading, then its rows,
 * an empty row or a closing note. The heading names the section.
 */
export const DashboardSection = ({ children }: Props) => {
  const headingId = useId()

  return (
    <DashboardSectionContext.Provider value={headingId}>
      <section aria-labelledby={headingId} className={styles.section}>
        {children}
      </section>
    </DashboardSectionContext.Provider>
  )
}
