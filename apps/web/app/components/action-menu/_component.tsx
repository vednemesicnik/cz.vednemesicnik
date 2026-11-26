import { clsx } from 'clsx'
import { createContext, type ReactNode, useContext, useId, useRef } from 'react'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type ActionMenuContextValue = {
  hide: () => void
}

const Context = createContext<ActionMenuContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
  label?: string
  align?: 'start' | 'end'
  size?: 'sm' | 'md'
  /** `chip`: a small white „⋯“ over an image tile's preview (24b). */
  variant?: 'button' | 'chip'
  className?: string
}

/**
 * The design system's „⋯“ menu beside a header's or a row's one primary
 * action. A role that may do nothing gets no items, and then no „⋯“: the
 * menu hides itself while it holds none. Built as a native popover anchored
 * to its trigger, a group of buttons rather than an ARIA menu.
 *
 * @param props.children - The `ActionMenuItem`s; a destructive one is
 *   `danger` and last.
 * @param props.label - The trigger's accessible name, e.g. „Další akce s účtem“.
 * @param props.align - The menu's edge that lines up with the trigger.
 * @param props.size - `sm` beside a list row's action (design 22a).
 * @param props.variant - `chip` over an image's preview (`ImageTile`, 24b).
 * @returns The trigger and its popover
 */
export const ActionMenu = ({
  children,
  label = 'Další akce',
  align = 'end',
  size = 'md',
  variant = 'button',
  className,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)
  // useId() contains colons, which are invalid in an id/anchor context.
  const menuId = `action-menu-${useId().replace(/:/g, '')}`

  // Guard the method too: it is undefined where the Popover API is absent.
  const hide = () => menuRef.current?.hidePopover?.()

  return (
    <Context.Provider value={{ hide }}>
      <span className={clsx(styles.actionMenu, className)}>
        {variant === 'chip' ? (
          <button
            aria-label={label}
            className={styles.chip}
            popoverTarget={menuId}
            type={'button'}
          >
            <span aria-hidden={'true'}>⋯</span>
          </button>
        ) : (
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
        )}

        <div
          className={clsx(styles.menu, styles[align])}
          id={menuId}
          popover={'auto'}
          ref={menuRef}
        >
          {children}
        </div>
      </span>
    </Context.Provider>
  )
}

/**
 * What the menu shares with its items: closing it before an item's action.
 *
 * @returns The action menu's context
 */
export const useActionMenu = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useActionMenu must be used within an ActionMenu')
  }

  return context
}
