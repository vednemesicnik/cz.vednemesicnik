import { Form, href } from 'react-router'

import { AdminAvatar } from '~/components/admin/admin-avatar'
import { useSidebarHighlight } from '~/components/admin/sidebar-highlight-provider'
import { BaseLink } from '~/components/base-link'
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
}

/**
 * The administration sidebar (design 22a, design system `AdminSidebar`): the brand on
 * top, content sections, people below a rule and the signed-in user at the bottom.
 * Callers pass only the items the user may see.
 */
export const AdministrationSidebar = ({
  contentItems,
  peopleItems,
  user,
}: Props) => {
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
    <aside className={styles.sidebar}>
      <BaseLink className={styles.brand} to={href('/administration')}>
        <VdmLogo className={styles.logo} />
        <span className={styles.brandText}>
          <VdmWordmark className={styles.name} tone={'text'} />
          <span className={styles.product}>Administrace</span>
        </span>
      </BaseLink>

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
        <BaseLink
          className={styles.footLink}
          to={href('/administration/settings/profile')}
        >
          Můj účet
        </BaseLink>
        <Form action={href('/administration/sign-out')} method={'post'}>
          <button className={styles.footLink} type={'submit'}>
            Odhlásit se
          </button>
        </Form>
      </div>
    </aside>
  )
}
