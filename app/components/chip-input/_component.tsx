import { clsx } from 'clsx'
import { type ReactNode, useRef } from 'react'

import { Label } from '~/components/label'
import { useCombobox } from '~/hooks/use-combobox'

import styles from './_styles.module.css'

export type ChipInputOption = {
  value: string
  label: string
}

type Props = {
  id: string
  label: string
  /** A heading over the field already names it; the label stays for readers. */
  isLabelHidden?: boolean
  placeholder?: string
  /** The suggestions for `query`, already filtered by the caller. */
  options: ChipInputOption[]
  query: string
  onQueryChange: (query: string) => void
  onSelect: (value: string) => void
  /** Backspace in the empty field removes the last chip. */
  onRemoveLast?: () => void
  disabled?: boolean
  /** The picked values as `Chip`s. */
  children?: ReactNode
  className?: string
}

/**
 * The design system's `ChipInput` (components/forms/ChipInput, yv8gi9i0): the
 * picked values as `Chip`s inside the field, and a list of suggestions under
 * it from the moment the field takes the focus, narrowed while typing. The
 * suggestions are data, not parts, because the field owns the active one and
 * the keys: arrows move, Enter picks, Escape closes.
 *
 * @param props.id - The search field's id, for the label.
 * @param props.query - The search text; empty, the list offers everything.
 * @param props.onSelect - A suggestion picked; the search empties.
 */
export const ChipInput = ({
  id,
  label,
  isLabelHidden = false,
  placeholder,
  options,
  query,
  onQueryChange,
  onSelect,
  onRemoveLast,
  disabled = false,
  children,
  className,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const changeQuery = (nextQuery: string) => {
    onQueryChange(nextQuery)
    combobox.reset()
  }

  const select = (option: ChipInputOption) => {
    onSelect(option.value)
    changeQuery('')
  }

  const combobox = useCombobox({
    // Open with the focus, not only once something is typed: the choice is
    // seen before it is searched.
    canOpen: options.length > 0,
    id,
    onPick: (index) => select(options[index]),
    optionCount: options.length,
  })

  return (
    <div className={clsx(styles.chipInput, className)}>
      <Label
        className={isLabelHidden ? 'screen-reader-only' : undefined}
        htmlFor={id}
      >
        {label}
      </Label>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: a click beside the chips reaches the field, which has the keys */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: as above */}
      <div
        className={clsx(styles.field, disabled && styles.disabled)}
        onClick={(event) => {
          // A click beside the chips, or a chip's ×, which leaves with its
          // chip: the field keeps the focus.
          if (
            event.target === event.currentTarget ||
            (event.target instanceof Element && event.target.closest('button'))
          ) {
            inputRef.current?.focus()
          }
        }}
      >
        {children}
        <input
          {...combobox.inputProps}
          className={styles.input}
          disabled={disabled}
          onChange={(event) => changeQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            // A held key clears the search, not the chips behind it.
            if (event.key === 'Backspace') {
              if (query === '' && !event.repeat) onRemoveLast?.()
              return
            }
            combobox.inputProps.onKeyDown(event)
          }}
          placeholder={placeholder}
          ref={inputRef}
          type={'text'}
          value={query}
        />
      </div>
      {/* Over what follows, so nothing moves while it shows. */}
      <div
        aria-label={label}
        className={styles.listbox}
        hidden={!combobox.isOpen}
        id={combobox.listboxId}
        role={'listbox'}
      >
        {options.map((option, index) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: the field owns the keys
          // biome-ignore lint/a11y/useFocusableInteractive: the field keeps the focus, aria-activedescendant points here
          <div
            aria-selected={index === combobox.activeIndex}
            className={clsx(
              styles.option,
              index === combobox.activeIndex && styles.active,
            )}
            id={combobox.getOptionId(index)}
            key={option.value}
            onClick={() => select(option)}
            // The field keeps the focus, so the list stays open.
            onMouseDown={(event) => event.preventDefault()}
            role={'option'}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  )
}
