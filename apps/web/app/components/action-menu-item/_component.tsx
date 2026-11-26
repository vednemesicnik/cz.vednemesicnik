import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useActionMenu } from '~/components/action-menu'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  danger?: boolean
  onSelect: () => void
  className?: string
}

/**
 * One action in an `ActionMenu`. Choosing it closes the menu first, then runs
 * the action. A destructive item goes last; the separator before the first
 * one is its own.
 *
 * @param props.children - The action's label, e.g. „Smazat…“
 * @param props.danger - A destructive action, in the error colour
 * @param props.onSelect - Runs once the menu has closed
 * @returns The separator, when destructive, and the item's button
 */
export const ActionMenuItem = ({
  children,
  danger = false,
  onSelect,
  className,
}: Props) => {
  const { hide } = useActionMenu()

  return (
    <>
      {danger && <hr className={styles.separator} />}
      <button
        className={clsx(styles.item, danger && styles.danger, className)}
        onClick={() => {
          hide()
          onSelect()
        }}
        type={'button'}
      >
        {children}
      </button>
    </>
  )
}
