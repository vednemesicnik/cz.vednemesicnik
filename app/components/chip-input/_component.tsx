import { clsx } from 'clsx'
import {
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Avatar } from '~/components/avatar'
import { Label } from '~/components/label'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

export type ChipInputOption = {
  value: string
  label: string
  /** Shown on the right, e.g. an author's role (ivyin4kr). */
  note?: string
  /** A person's photo: the suggestion starts with their avatar. */
  avatar?: ImageSources
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
  /** The line under a search that found nothing; not an option. */
  emptyLabel?: string
  /**
   * The last option, for a value that is not there yet (*Založit autora
   * „…“*); shown with `onCreate` while the search has text, in place of
   * `emptyLabel`.
   */
  createLabel?: string
  onCreate?: () => void
  disabled?: boolean
  /**
   * The picked values as `Chip`s. Without them the field only searches, and
   * the picked values are shown elsewhere, as the author rows (ivyin4kr).
   */
  children?: ReactNode
  ref?: Ref<HTMLInputElement>
  className?: string
}

/**
 * The design system's `ChipInput` (components/forms/ChipInput, yv8gi9i0,
 * ivyin4kr): the picked values as `Chip`s inside the field, and a list of
 * suggestions under it from the moment the field takes the focus, narrowed
 * while typing. The suggestions are data, not parts, because the field owns
 * the active one and the keys: arrows move, Enter picks, Escape closes.
 *
 * @param props.id - The search field's id, for the label.
 * @param props.query - The search text; empty, the list offers everything.
 * @param props.onSelect - A suggestion picked; the search empties.
 * @param props.onCreate - The create option picked; the caller goes on.
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
  emptyLabel,
  createLabel,
  onCreate,
  disabled = false,
  children,
  ref,
  className,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const listboxId = `${id}-listbox`
  const optionId = (index: number) => `${id}-option-${index}`
  const hasQuery = query.trim() !== ''
  const hasCreate =
    hasQuery && createLabel !== undefined && onCreate !== undefined
  const hasEmpty =
    hasQuery && options.length === 0 && !hasCreate && emptyLabel !== undefined
  // The create option is the last one.
  const optionCount = options.length + (hasCreate ? 1 : 0)
  // Open with the focus, not only once something is typed: the choice is
  // seen before it is searched.
  const isOpen = isFocused && !isDismissed && (optionCount > 0 || hasEmpty)
  const hasActive = isOpen && optionCount > 0
  const active = Math.min(activeIndex, optionCount - 1)

  // The active suggestion stays in sight in a long list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the option's id follows `active`
  useEffect(() => {
    if (hasActive) {
      document
        .getElementById(optionId(active))
        ?.scrollIntoView({ block: 'nearest' })
    }
  }, [hasActive, active])

  const changeQuery = (nextQuery: string) => {
    onQueryChange(nextQuery)
    setActiveIndex(0)
    setIsDismissed(false)
  }

  const select = (option: ChipInputOption) => {
    onSelect(option.value)
    changeQuery('')
  }

  const pick = (index: number) =>
    index === options.length ? onCreate?.() : select(options[index])

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
        if (!hasActive) return
        event.preventDefault()
        setActiveIndex(
          event.key === 'ArrowDown'
            ? Math.min(active + 1, optionCount - 1)
            : Math.max(active - 1, 0),
        )
        return
      // Enter never submits the form around the field.
      case 'Enter':
        event.preventDefault()
        if (hasActive) pick(active)
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
          aria-activedescendant={hasActive ? optionId(active) : undefined}
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
          ref={(element) => {
            inputRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          role={'combobox'}
          type={'text'}
          value={query}
        />
      </div>
      {/* Over what follows, so nothing moves while it shows. */}
      <div className={styles.popup} hidden={!isOpen}>
        <div
          aria-label={label}
          className={styles.listbox}
          hidden={optionCount === 0}
          id={listboxId}
          role={'listbox'}
        >
          {options.map((option, index) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: the field owns the keys
            // biome-ignore lint/a11y/useFocusableInteractive: the field keeps the focus, aria-activedescendant points here
            <div
              aria-selected={index === active}
              className={clsx(
                styles.option,
                option.avatar !== undefined && styles.rich,
                index === active && styles.active,
              )}
              id={optionId(index)}
              key={option.value}
              onClick={() => select(option)}
              // The field keeps the focus, so the list stays open.
              onMouseDown={(event) => event.preventDefault()}
              role={'option'}
            >
              {option.avatar === undefined ? (
                option.label
              ) : (
                <>
                  <Avatar image={option.avatar} name={option.label} size={24} />
                  <span className={styles.label}>{option.label}</span>
                  {option.note !== undefined && (
                    <span className={styles.note}>{option.note}</span>
                  )}
                </>
              )}
            </div>
          ))}
          {hasCreate && (
            // biome-ignore lint/a11y/useKeyWithClickEvents: the field owns the keys
            // biome-ignore lint/a11y/useFocusableInteractive: the field keeps the focus, aria-activedescendant points here
            <div
              aria-selected={options.length === active}
              className={clsx(
                styles.option,
                styles.create,
                options.length === active && styles.active,
              )}
              id={optionId(options.length)}
              onClick={() => onCreate?.()}
              onMouseDown={(event) => event.preventDefault()}
              role={'option'}
            >
              {createLabel}
            </div>
          )}
        </div>
        {hasEmpty && <p className={styles.empty}>{emptyLabel}</p>}
      </div>
    </div>
  )
}
