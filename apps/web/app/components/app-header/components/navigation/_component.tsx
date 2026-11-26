import type { ReactNode } from 'react'
import { HomeLink } from '~/components/app-header/components/home-link'
import { useFullScreenMenu } from '~/hooks/use-full-screen-menu'

import styles from './_styles.module.css'

// Below this width the items move behind Menu (design 10b, qgr43icu).
const INLINE_NAVIGATION_QUERY = '(width >= 768px)'

type Props = {
  children: ReactNode
}

export const Navigation = ({ children }: Props) => {
  // Zavřít stands where Menu was, so focus starts there (design 10b, qgr43icu).
  const { close, closeButtonRef, isMenuOpen, menuRef, open } =
    useFullScreenMenu(INLINE_NAVIGATION_QUERY)

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>{children}</ul>
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup={'dialog'}
        className={styles.menuButton}
        onClick={open}
        type={'button'}
      >
        Menu
      </button>
      <dialog aria-label={'Menu'} className={styles.menu} ref={menuRef}>
        <div className={styles.menuHeader}>
          <HomeLink />
          <button
            className={styles.menuButton}
            onClick={close}
            ref={closeButtonRef}
            type={'button'}
          >
            Zavřít
          </button>
        </div>
        <ul className={styles.menuList}>{children}</ul>
      </dialog>
    </nav>
  )
}
