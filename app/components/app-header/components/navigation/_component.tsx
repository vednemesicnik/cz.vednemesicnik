import { type ReactNode, useEffect, useRef, useState } from 'react'
import { HomeLink } from '~/components/app-header/components/home-link'

import styles from './_styles.module.css'

// Below this width the items move behind Menu (design 10b, qgr43icu).
const INLINE_NAVIGATION_QUERY = '(width >= 768px)'

type Props = {
  children: ReactNode
}

export const Navigation = ({ children }: Props) => {
  const menuRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleOpen = () => {
    menuRef.current?.showModal()
    // Zavřít stands where Menu was, so focus starts there (design 10b, qgr43icu).
    closeButtonRef.current?.focus()
    setIsMenuOpen(true)
  }

  const handleClose = () => {
    menuRef.current?.close()
  }

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    // Esc closes the dialog natively; the `close` event covers it and the button alike.
    const handleMenuClose = () => setIsMenuOpen(false)
    // A followed link would otherwise leave the menu open over the next page.
    const handleMenuClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a')) {
        menu.close()
      }
    }
    const inlineNavigation = window.matchMedia(INLINE_NAVIGATION_QUERY)
    const handleWidthChange = () => {
      if (inlineNavigation.matches) menu.close()
    }

    menu.addEventListener('close', handleMenuClose)
    menu.addEventListener('click', handleMenuClick)
    inlineNavigation.addEventListener('change', handleWidthChange)

    return () => {
      menu.removeEventListener('close', handleMenuClose)
      menu.removeEventListener('click', handleMenuClick)
      inlineNavigation.removeEventListener('change', handleWidthChange)
    }
  }, [])

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>{children}</ul>
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup={'dialog'}
        className={styles.menuButton}
        onClick={handleOpen}
        type={'button'}
      >
        Menu
      </button>
      <dialog aria-label={'Menu'} className={styles.menu} ref={menuRef}>
        <div className={styles.menuHeader}>
          <HomeLink />
          <button
            className={styles.menuButton}
            onClick={handleClose}
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
