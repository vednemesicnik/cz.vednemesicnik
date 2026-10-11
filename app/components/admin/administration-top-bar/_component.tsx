import { clsx } from 'clsx'

import { useSidebarHighlight } from '~/components/admin/sidebar-highlight-provider'
import { Button } from '~/components/button'
import { VdmLogo } from '~/components/vdm-logo'

import styles from './_styles.module.css'

type Props = {
  title?: string
  menuLabel?: string
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
 * @param props.title - The label of the active sidebar item (Nastavení on the
 * account pages). Not shown while a boundary turns the sidebar's highlight off
 * (30e, 30h): the bar then holds only the logo and Menu (22j).
 * @param props.menuLabel - The menu button's label.
 * @param props.onMenu - Called by the menu button.
 * @param props.expanded - Whether the menu is open.
 * @param props.controls - The id of the menu's dialog.
 */
export const AdministrationTopBar = ({
  title,
  menuLabel = 'Menu',
  onMenu,
  expanded = false,
  controls,
  className,
}: Props) => {
  const highlightsSection = useSidebarHighlight()

  return (
    <header className={clsx(styles.topBar, className)}>
      <VdmLogo className={styles.logo} />
      {title && highlightsSection && (
        <span className={styles.title}>{title}</span>
      )}
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
        {menuLabel}
      </Button>
    </header>
  )
}
