import type { ReactNode } from 'react'
import { CloseIcon } from '~/components/icons/close-icon'
import { MenuIcon } from '~/components/icons/menu-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const Navigation = ({ children }: Props) => (
  <nav className={styles.container}>
    <button
      aria-label={'Otevřít menu'}
      className={styles.menuButton}
      popoverTarget={'primary-navigation'}
      popoverTargetAction={'toggle'}
      type={'button'}
    >
      <span className={styles.openIcon}>
        <MenuIcon />
      </span>
      <span className={styles.closeIcon}>
        <CloseIcon />
      </span>
    </button>
    <div className={styles.panel} id={'primary-navigation'} popover={'auto'}>
      <ul className={styles.list}>{children}</ul>
    </div>
  </nav>
)
