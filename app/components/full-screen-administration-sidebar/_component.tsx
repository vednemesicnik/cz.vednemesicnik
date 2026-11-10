import { clsx } from 'clsx'
import type { ReactNode, Ref } from 'react'

import { AdministrationSidebarShapeProvider } from '~/components/administration-sidebar-shape-provider'
import { Button } from '~/components/button'
import { Hyperlink } from '~/components/hyperlink'
import { VdmLogo } from '~/components/vdm-logo'
import { VdmWordmark } from '~/components/vdm-wordmark'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  onClose: () => void
  closeButtonRef?: Ref<HTMLButtonElement>
  className?: string
}

/**
 * The administration sidebar below 768 px, over the whole screen from Menu
 * (tbi5qpq9): Zavřít in the brand row and 44 px rows. The caller puts it in a
 * modal `<dialog>`. `ColumnAdministrationSidebar` is the same sidebar beside
 * the content.
 *
 * @param props.children - The `AdministrationSidebarNav` and the
 *   `AdministrationSidebarFoot`
 * @param props.onClose - Called by Zavřít
 * @param props.closeButtonRef - Zavřít, which gets focus on opening
 * @returns The sidebar's `<aside>`
 */
export const FullScreenAdministrationSidebar = ({
  children,
  onClose,
  closeButtonRef,
  className,
}: Props) => {
  return (
    <AdministrationSidebarShapeProvider shape={'full-screen'}>
      <aside className={clsx(styles.sidebar, className)}>
        <div className={styles.head}>
          {/* Not a link: Přehled is the first item below (design 22a, tyxr2jqk). */}
          <div className={styles.brand}>
            <VdmLogo className={styles.logo} />
            <span className={styles.brandText}>
              <VdmWordmark className={styles.name} tone={'text'} />
              <span className={styles.product}>Administrace</span>
            </span>
            {/* Zavřít stands where Menu was in the top bar (tbi5qpq9). */}
            <Button
              className={styles.closeButton}
              onClick={onClose}
              ref={closeButtonRef}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zavřít
            </Button>
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
