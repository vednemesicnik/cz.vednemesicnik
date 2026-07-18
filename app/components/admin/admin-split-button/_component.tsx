import { clsx } from 'clsx'
import { type ComponentProps, type ReactNode, useId, useRef } from 'react'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { ArrowDropDownIcon } from '~/components/icons/arrow-drop-down-icon'
import { CheckIcon } from '~/components/icons/check-icon'

import styles from './_styles.module.css'

type Option = {
  id: string
  label: string
}

type Props = {
  // The main segment. The parent renders an AdminActionButton here whose label
  // and behaviour reflect the currently selected mode; this component only
  // frames it and stays presentational.
  children: ReactNode
  // Colours the chevron segment so it matches the main AdminActionButton.
  action: ComponentProps<typeof AdminActionButton>['action']
  options: Option[]
  selectedId: string
  onSelect: (id: string) => void
  // Disables the chevron segment too, so both segments can be locked together
  // (e.g. while submitting); the parent disables the main segment via children.
  disabled?: boolean
  title?: string
  chevronAriaLabel?: string
}

export const AdminSplitButton = ({
  children,
  action,
  options,
  selectedId,
  onSelect,
  disabled,
  title,
  chevronAriaLabel = 'Další možnosti publikace',
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)
  // useId() contains colons, which are invalid in an id/anchor context.
  const menuId = `admin-split-button-menu-${useId().replace(/:/g, '')}`

  const handleSelect = (id: string) => {
    onSelect(id)
    // Guard the method too: it is undefined where the Popover API is absent.
    menuRef.current?.hidePopover?.()
  }

  return (
    <div className={styles.splitButton}>
      {children}

      <AdminActionButton
        action={action}
        aria-label={chevronAriaLabel}
        className={styles.chevron}
        disabled={disabled}
        popoverTarget={menuId}
        title={title}
        type={'button'}
      >
        <ArrowDropDownIcon />
      </AdminActionButton>

      {/*
        Native popover: the chevron (its popovertarget invoker) becomes the
        implicit anchor, so the menu is positioned in CSS with anchor
        positioning. Modelled as a button group in a popover, not an ARIA menu.
      */}
      <div className={styles.menu} id={menuId} popover={'auto'} ref={menuRef}>
        {options.map((option) => {
          const isSelected = option.id === selectedId

          return (
            <button
              aria-pressed={isSelected}
              className={styles.menuItem}
              key={option.id}
              onClick={() => handleSelect(option.id)}
              type={'button'}
            >
              {/* Decorative: aria-pressed already conveys the selected state,
                  so hide the check (which has its own accessible name) from AT. */}
              <span
                aria-hidden={'true'}
                className={clsx(
                  styles.check,
                  !isSelected && styles.checkHidden,
                )}
              >
                <CheckIcon />
              </span>
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
