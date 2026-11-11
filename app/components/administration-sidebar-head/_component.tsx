import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useAdministrationSidebarShape } from '~/components/administration-sidebar-shape-provider'
import { Hyperlink } from '~/components/hyperlink'
import { VdmLogo } from '~/components/vdm-logo'
import { VdmWordmark } from '~/components/vdm-wordmark'

import styles from './_styles.module.css'

type Props = {
  children?: ReactNode
  className?: string
}

/**
 * The top of the administration sidebar, the same in both roots: the brand,
 * then the website link under it (s21ljh49). The full-screen menu puts Zavřít
 * at the end of the brand row.
 *
 * @param props.children - What ends the brand row, e.g. Zavřít
 * @returns The head block
 */
export const AdministrationSidebarHead = ({ children, className }: Props) => {
  const shape = useAdministrationSidebarShape()

  return (
    <div
      className={clsx(
        styles.head,
        shape === 'full-screen' && styles.fullScreen,
        className,
      )}
    >
      {/* Not a link: Přehled is the first item below (design 22a, tyxr2jqk). */}
      <div className={styles.brand}>
        <VdmLogo className={styles.logo} />
        <span className={styles.brandText}>
          <VdmWordmark className={styles.name} tone={'text'} />
          <span className={styles.product}>Administrace</span>
        </span>
        {children}
      </div>
      {/* The website in a new tab, at hand on every page (s21ljh49). */}
      <Hyperlink className={styles.siteLink} href={'/'}>
        Zobrazit web
      </Hyperlink>
    </div>
  )
}
