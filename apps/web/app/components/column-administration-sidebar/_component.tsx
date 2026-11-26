import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { AdministrationSidebarHead } from '~/components/administration-sidebar-head'
import { AdministrationSidebarShapeProvider } from '~/components/administration-sidebar-shape-provider'

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
        <AdministrationSidebarHead />
        {children}
      </aside>
    </AdministrationSidebarShapeProvider>
  )
}
