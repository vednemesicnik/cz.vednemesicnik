import { clsx } from 'clsx'
import type { ReactNode, Ref } from 'react'

import { TextField } from '~/components/text-field'
import { useCombobox } from '~/hooks/use-combobox'

import styles from './_styles.module.css'

type Props<Option extends { value: string }> = {
  id: string
  label: string
  /** A heading over the field already names it; the label stays for readers. */
  isLabelHidden?: boolean
  placeholder?: string
  /** The suggestions for `query`, already filtered by the caller. */
  options: Option[]
  query: string
  onQueryChange: (query: string) => void
  onSelect: (value: string) => void
  /** What the list says when the search finds nothing, a link included. */
  noMatch?: ReactNode
  disabled?: boolean
  /** Draws a suggestion's content; the row around it belongs to the field. */
  children: (option: Option) => ReactNode
  ref?: Ref<HTMLInputElement>
  className?: string
}

/**
 * A search field that suggests from the first letter typed and adds the picked
 * value somewhere else, the field emptying again (design 24j). Like
 * `ChipInput`, without the chips: the suggestions are data, because the field
 * owns the active one and the keys (arrows move, Enter picks, Escape closes).
 *
 * @param props.query - The search text; empty, the list stays closed.
 * @param props.onSelect - A suggestion picked; the search empties.
 * @param props.noMatch - Shown under the field while the search has text and
 *   no suggestion; it stays reachable with Tab.
 * @param props.children - Renders one suggestion.
 */
export const SuggestInput = <Option extends { value: string }>({
  id,
  label,
  isLabelHidden = false,
  placeholder,
  options,
  query,
  onQueryChange,
  onSelect,
  noMatch,
  disabled = false,
  children,
  ref,
  className,
}: Props<Option>) => {
  const hasNoMatch = options.length === 0 && noMatch !== undefined

  const changeQuery = (nextQuery: string) => {
    onQueryChange(nextQuery)
    combobox.reset()
  }

  const select = (option: Option) => {
    onSelect(option.value)
    changeQuery('')
  }

  const combobox = useCombobox({
    // From the first letter, not on focus (24j).
    canOpen: query.trim() !== '' && (options.length > 0 || hasNoMatch),
    id,
    onPick: (index) => select(options[index]),
    optionCount: options.length,
  })

  return (
    <div className={clsx(styles.suggestInput, className)}>
      <TextField
        {...combobox.inputProps}
        disabled={disabled}
        isLabelHidden={isLabelHidden}
        label={label}
        onChange={(event) => changeQuery(event.currentTarget.value)}
        placeholder={placeholder}
        ref={ref}
        type={'text'}
        value={query}
      />
      {/* Over what follows, so nothing moves while it shows. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a press inside only keeps the focus in the field; the options and the link are the controls */}
      <div
        {...combobox.popupProps}
        className={styles.popup}
        hidden={!combobox.isOpen}
        // The field keeps the focus, so the list stays open.
        onMouseDown={(event) => event.preventDefault()}
      >
        <div
          aria-label={label}
          className={styles.listbox}
          hidden={options.length === 0}
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
              role={'option'}
            >
              {children(option)}
            </div>
          ))}
        </div>
        {hasNoMatch && <p className={styles.noMatch}>{noMatch}</p>}
      </div>
    </div>
  )
}
