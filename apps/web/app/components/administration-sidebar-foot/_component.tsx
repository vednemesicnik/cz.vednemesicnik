import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { Form, href, useLocation } from 'react-router'

import { useSidebarHighlight } from '~/components/admin/sidebar-highlight-provider'
import { AdministrationSidebarLink } from '~/components/administration-sidebar-link'
import { useAdministrationSidebarShape } from '~/components/administration-sidebar-shape-provider'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The bottom of the sidebar: the signed-in user, then Nastavení (the
 * account's own settings, 29a) and sign-out under the name.
 *
 * @param props.children - The `AdministrationSidebarUser`
 * @returns The foot with its two links
 */
export const AdministrationSidebarFoot = ({ children, className }: Props) => {
  const highlightsSection = useSidebarHighlight()
  const shape = useAdministrationSidebarShape()
  const location = useLocation()
  const rowClassName = shape === 'full-screen' && styles.fullScreenRow

  return (
    <div className={clsx(styles.foot, className)}>
      {children}
      <AdministrationSidebarLink
        className={clsx(styles.accountLink, rowClassName)}
        highlightsActive={highlightsSection}
        to={href('/administration/settings')}
      >
        Nastavení
      </AdministrationSidebarLink>
      <Form
        action={href('/administration/sign-out')}
        className={styles.signOutForm}
        method={'post'}
      >
        {/* Sign-in after sign-out returns here (not read from Referer). */}
        <input
          name={'redirectTo'}
          type={'hidden'}
          value={`${location.pathname}${location.search}`}
        />
        <button
          className={clsx(styles.signOutButton, rowClassName)}
          type={'submit'}
        >
          Odhlásit se
        </button>
      </Form>
    </div>
  )
}
