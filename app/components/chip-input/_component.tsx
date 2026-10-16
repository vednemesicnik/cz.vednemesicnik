import { clsx } from 'clsx'
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Label } from '~/components/label'

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
  const [isFocused, setIsFocused] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const listboxId = `${id}-listbox`
  const optionId = (index: number) => `${id}-option-${index}`
  // Open with the focus, not only once something is typed: the choice is
  // seen before it is searched.
  const isOpen = isFocused && !isDismissed && options.length > 0
  const active = Math.min(activeIndex, options.length - 1)

  // The active suggestion stays in sight in a long list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the option's id follows `active`
  useEffect(() => {
    if (isOpen) {
      document
        .getElementById(optionId(active))
        ?.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, active])

  const changeQuery = (nextQuery: string) => {
    onQueryChange(nextQuery)
    setActiveIndex(0)
    setIsDismissed(false)
  }

  const select = (option: ChipInputOption) => {
    onSelect(option.value)
    changeQuery('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        // An arrow opens a list closed with Escape again.
        if (isDismissed) {
          event.preventDefault()
          setIsDismissed(false)
          return
        }
        if (!isOpen) return
        event.preventDefault()
        setActiveIndex(
          event.key === 'ArrowDown'
            ? Math.min(active + 1, options.length - 1)
            : Math.max(active - 1, 0),
        )
        return
      // Enter never submits the form around the field.
      case 'Enter':
        event.preventDefault()
        if (isOpen) select(options[active])
        return
      // Closes only the list, not a panel the field stands in.
      case 'Escape':
        if (!isOpen) return
        event.preventDefault()
        event.stopPropagation()
        setIsDismissed(true)
        return
      // A held key clears the search, not the chips behind it.
      case 'Backspace':
        if (query === '' && !event.repeat) onRemoveLast?.()
        return
    }
  }

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
          aria-activedescendant={isOpen ? optionId(active) : undefined}
          aria-autocomplete={'list'}
          aria-controls={listboxId}
          aria-expanded={isOpen}
          autoComplete={'off'}
          className={styles.input}
          disabled={disabled}
          id={id}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => changeQuery(event.currentTarget.value)}
          // A click opens a list closed with Escape again.
          onClick={() => setIsDismissed(false)}
          onFocus={() => {
            setIsFocused(true)
            setIsDismissed(false)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          role={'combobox'}
          type={'text'}
          value={query}
        />
      </div>
      {/* Over what follows, so nothing moves while it shows. */}
      <div
        aria-label={label}
        className={styles.listbox}
        hidden={!isOpen}
        id={listboxId}
        role={'listbox'}
      >
        {options.map((option, index) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: the field owns the keys
          // biome-ignore lint/a11y/useFocusableInteractive: the field keeps the focus, aria-activedescendant points here
          <div
            aria-selected={index === active}
            className={clsx(styles.option, index === active && styles.active)}
            id={optionId(index)}
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
