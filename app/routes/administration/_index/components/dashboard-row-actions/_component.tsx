import type { ReactNode } from 'react'

import { ActionMenu } from '~/components/action-menu'
import {
  TableActionsCell,
  TableRowActions,
  TableRowMenu,
} from '~/components/admin/admin-table'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'

import styles from './_styles.module.css'

type Props<Action extends string> = {
  row: Action | null
  menu: readonly Action[]
  getLabel: (action: Action) => string
  onRun: (action: Action) => void
  isSubmitting: boolean
  /** Upravit on the row opens the editor as a link, as in the list (22b). */
  editHref?: string
  /** „⋯“'s accessible name, with the record's name. */
  menuLabel: string
  /** The dialogs of the record's actions. */
  children: ReactNode
}

/**
 * A dashboard row's actions (design 21a, 07c): the section's action on the
 * row, the rest in „⋯“; on a phone „⋯“ stands alone with the row action
 * first (22g).
 */
export const DashboardRowActions = <Action extends string>({
  row,
  menu,
  getLabel,
  onRun,
  isSubmitting,
  editHref,
  menuLabel,
  children,
}: Props<Action>) => {
  const toMenuItem = (action: Action) => ({
    danger: action === 'delete',
    label: getLabel(action),
    onSelect: () => onRun(action),
  })
  const phoneMenu = row === null ? menu : [row, ...menu]

  return (
    <TableActionsCell>
      {phoneMenu.length > 0 && (
        <TableRowMenu phoneOnly={true}>
          <ActionMenu
            items={phoneMenu.map(toMenuItem)}
            label={menuLabel}
            size={'sm'}
          />
        </TableRowMenu>
      )}
      <TableRowActions>
        {row === 'edit' && editHref !== undefined && (
          <LinkButton
            disabled={isSubmitting}
            size={'sm'}
            to={editHref}
            variant={'outline'}
          >
            {getLabel(row)}
          </LinkButton>
        )}
        {row !== null && (row !== 'edit' || editHref === undefined) && (
          <Button
            disabled={isSubmitting}
            onClick={() => onRun(row)}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            {getLabel(row)}
          </Button>
        )}
        {menu.length > 0 && (
          <ActionMenu
            items={menu.map(toMenuItem)}
            label={menuLabel}
            size={'sm'}
          />
        )}
      </TableRowActions>

      {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
      <div className={styles.dialogs}>{children}</div>
    </TableActionsCell>
  )
}
