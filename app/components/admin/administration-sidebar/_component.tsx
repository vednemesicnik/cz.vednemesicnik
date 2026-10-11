import { clsx } from 'clsx'
import type { Ref } from 'react'
import { Form, href } from 'react-router'

import { AdminAvatar } from '~/components/admin/admin-avatar'
import { useSidebarHighlight } from '~/components/admin/sidebar-highlight-provider'
import { Button } from '~/components/button'
import { VdmLogo } from '~/components/vdm-logo'
import { VdmWordmark } from '~/components/vdm-wordmark'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'
import { SidebarLink } from './components/sidebar-link'

export type NavigationItem = {
  to: string
  label: string
  end?: boolean
}

export type SidebarUser = {
  name: string
  roleLabel: string | undefined
  image: ImageSources
}

type Props = {
  // Content sections (Přehled, Články, …), above the rule.
  contentItems: NavigationItem[]
  // People sections (Autoři, Uživatelé, …), below the rule.
  peopleItems: NavigationItem[]
  user: SidebarUser
  layout?: 'column' | 'menu'
  closeLabel?: string
  onClose?: () => void
  closeButtonRef?: Ref<HTMLButtonElement>
  className?: string
}

/**
 * The administration sidebar (design 22a, design system `AdminSidebar`): the brand on
 * top, content sections, people below a rule and the signed-in user at the bottom,
 * with Nastavení (the account's own settings, 29a) and sign-out under the name.
 * Callers pass only the items the user may see.
 *
 * @param props.layout - `column` beside the content from 768 px, `menu` below it:
 * over the whole screen from Menu, with Zavřít in the brand row and 44 px rows
 * (tbi5qpq9). The caller puts the menu layout in a modal `<dialog>`.
 * @param props.closeLabel - The close button's label in the menu layout.
 * @param props.onClose - Called by the close button in the menu layout.
 * @param props.closeButtonRef - The close button, which gets focus on opening.
 */
export const AdministrationSidebar = ({
  contentItems,
  peopleItems,
  user,
  layout = 'column',
  closeLabel = 'Zavřít',
  onClose,
  closeButtonRef,
  className,
}: Props) => {
  const isMenu = layout === 'menu'
  const highlightsSection = useSidebarHighlight()

  const renderItem = (item: NavigationItem) => (
    <li className={styles.item} key={item.to}>
      <SidebarLink
        end={item.end}
        highlightsActive={highlightsSection}
        to={item.to}
      >
        {item.label}
      </SidebarLink>
    </li>
  )

  return (
    <aside className={clsx(styles.sidebar, isMenu && styles.menu, className)}>
      {/* Not a link: Přehled is the first item below (design 22a, tyxr2jqk). */}
      <div className={styles.brand}>
        <VdmLogo className={styles.logo} />
        <span className={styles.brandText}>
          <VdmWordmark className={styles.name} tone={'text'} />
          <span className={styles.product}>Administrace</span>
        </span>
        {isMenu && (
          // Zavřít stands where Menu was in the top bar (tbi5qpq9).
          <Button
            className={styles.closeButton}
            onClick={onClose}
            ref={closeButtonRef}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            {closeLabel}
          </Button>
        )}
      </div>

      <nav aria-label={'Administrace'} className={styles.nav}>
        <ul className={styles.list}>{contentItems.map(renderItem)}</ul>
        {peopleItems.length > 0 && (
          <>
            <hr className={styles.separator} />
            <ul className={styles.list}>{peopleItems.map(renderItem)}</ul>
          </>
        )}
      </nav>

      <div className={styles.foot}>
        <div className={styles.user}>
          <AdminAvatar
            alt={user.name}
            image={user.image}
            name={user.name}
            size={'extra-small'}
          />
          <span className={styles.userText}>
            <span className={styles.userName}>{user.name}</span>
            {user.roleLabel && (
              <span className={styles.role}>{user.roleLabel}</span>
            )}
          </span>
        </div>
        <SidebarLink
          className={styles.accountLink}
          highlightsActive={highlightsSection}
          to={href('/administration/settings')}
        >
          Nastavení
        </SidebarLink>
        <Form
          action={href('/administration/sign-out')}
          className={styles.signOutForm}
          method={'post'}
        >
          <button className={styles.footLink} type={'submit'}>
            Odhlásit se
          </button>
        </Form>
      </div>
    </aside>
  )
}
