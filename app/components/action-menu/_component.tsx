import { clsx } from 'clsx'
import { Fragment, useId, useRef } from 'react'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Item = {
  label: string
  danger?: boolean
  onSelect: () => void
}

type Props = {
  items: Item[]
  label?: string
  align?: 'start' | 'end'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * The design system's „⋯“ menu beside a header's or a row's one primary
 * action. A role that may do nothing gets an empty list, and then no „⋯“.
 * Built as a native popover anchored to its trigger, a group of buttons
 * rather than an ARIA menu.
 *
 * @param props.items - The actions; a destructive one is `danger` and last.
 * @param props.label - The trigger's accessible name, e.g. „Další akce s účtem“.
 * @param props.align - The menu's edge that lines up with the trigger.
 * @param props.size - `sm` beside a list row's action (design 22a).
 */
export const ActionMenu = ({
  items,
  label = 'Další akce',
  align = 'end',
  size = 'md',
  className,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)
  // useId() contains colons, which are invalid in an id/anchor context.
  const menuId = `action-menu-${useId().replace(/:/g, '')}`

  if (items.length === 0) return null

  const handleSelect = (item: Item) => {
    // Guard the method too: it is undefined where the Popover API is absent.
    menuRef.current?.hidePopover?.()
    item.onSelect()
  }

  return (
    <span className={clsx(styles.actionMenu, className)}>
      <Button
        aria-label={label}
        className={clsx(styles.trigger, styles[size])}
        popoverTarget={menuId}
        size={size}
        type={'button'}
        variant={'outline'}
      >
        <span aria-hidden={'true'}>⋯</span>
      </Button>

      <div
        className={clsx(styles.menu, styles[align])}
        id={menuId}
        popover={'auto'}
        ref={menuRef}
      >
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {/* Destructive items go last, after a separator (design system). */}
            {item.danger && index > 0 && !items[index - 1].danger && (
              <hr className={styles.separator} />
            )}
            <button
              className={clsx(styles.item, item.danger && styles.danger)}
              onClick={() => handleSelect(item)}
              type={'button'}
            >
              {item.label}
            </button>
          </Fragment>
        ))}
      </div>
    </span>
  )
}
