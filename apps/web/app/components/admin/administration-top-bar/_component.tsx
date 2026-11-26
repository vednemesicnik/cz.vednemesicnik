import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Button } from '~/components/button'
import { VdmLogo } from '~/components/vdm-logo'

import styles from './_styles.module.css'

type Props = {
  children?: ReactNode
  onMenu?: () => void
  expanded?: boolean
  controls?: string
  className?: string
}

/**
 * The administration top bar below 768 px (design 22g, design system
 * `AdminTopBar`, tbi5qpq9): the logo, the page's name and Menu, which opens the
 * sidebar over the whole screen. It sticks to the top, hides while scrolling
 * down and returns on the way up, like the website header.
 *
 * @param props.children - The page's name, an `AdministrationTopBarTitle`.
 * @param props.onMenu - Called by the menu button.
 * @param props.expanded - Whether the menu is open.
 * @param props.controls - The id of the menu's dialog.
 */
export const AdministrationTopBar = ({
  children,
  onMenu,
  expanded = false,
  controls,
  className,
}: Props) => (
  <header className={clsx(styles.topBar, className)}>
    <VdmLogo className={styles.logo} />
    {children}
    <Button
      aria-controls={controls}
      aria-expanded={expanded}
      aria-haspopup={'dialog'}
      className={styles.menuButton}
      onClick={onMenu}
      size={'sm'}
      type={'button'}
      variant={'ghost'}
    >
      Menu
    </Button>
  </header>
)
