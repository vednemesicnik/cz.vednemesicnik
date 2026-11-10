import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { AdministrationSidebarShapeProvider } from '~/components/administration-sidebar-shape-provider'
import { Hyperlink } from '~/components/hyperlink'
import { VdmLogo } from '~/components/vdm-logo'
import { VdmWordmark } from '~/components/vdm-wordmark'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The administration sidebar beside the content from 768 px (design 22a,
 * design system `AdminSidebar`): the brand on top with the website link under
 * it (s21ljh49), then its parts. `FullScreenAdministrationSidebar` is the same
 * sidebar over the whole screen below 768 px.
 *
 * @example
 * ```tsx
 * <ColumnAdministrationSidebar>
 *   <AdministrationSidebarNav>…</AdministrationSidebarNav>
 *   <AdministrationSidebarFoot>…</AdministrationSidebarFoot>
 * </ColumnAdministrationSidebar>
 * ```
 *
 * @param props.children - The `AdministrationSidebarNav` and the
 *   `AdministrationSidebarFoot`
 * @returns The sidebar's `<aside>`
 */
export const ColumnAdministrationSidebar = ({ children, className }: Props) => {
  return (
    <AdministrationSidebarShapeProvider shape={'column'}>
      <aside className={clsx(styles.sidebar, className)}>
        <div className={styles.head}>
          {/* Not a link: Přehled is the first item below (design 22a, tyxr2jqk). */}
          <div className={styles.brand}>
            <VdmLogo className={styles.logo} />
            <span className={styles.brandText}>
              <VdmWordmark className={styles.name} tone={'text'} />
              <span className={styles.product}>Administrace</span>
            </span>
          </div>
          {/* The website in a new tab, at hand on every page (s21ljh49). */}
          <Hyperlink className={styles.siteLink} href={'/'}>
            Zobrazit web
          </Hyperlink>
        </div>
        {children}
      </aside>
    </AdministrationSidebarShapeProvider>
  )
}
