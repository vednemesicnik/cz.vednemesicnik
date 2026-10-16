import { type FocusEvent, type KeyboardEvent, useEffect, useState } from 'react'

type Options = {
  /** The search field's id; the list's and the options' ids derive from it. */
  id: string
  optionCount: number
  /** Whether the list may show while the field has the focus. */
  canOpen: boolean
  /** An option picked with Enter, by its index. */
  onPick: (index: number) => void
}

/**
 * A search field with a list of suggestions under it (ARIA combobox): the field
 * keeps the focus and owns the keys, the active option is pointed at with
 * `aria-activedescendant`. Arrows move, Enter picks, Escape closes only the
 * list; an arrow or a click opens a closed list again. Shared by `ChipInput`
 * and `SuggestInput`.
 *
 * @returns Whether the list shows, the active option, the ids, the props for
 *   the field, and `reset` for a new search (the first option active, the list
 *   allowed to open).
 */
export const useCombobox = ({ id, optionCount, canOpen, onPick }: Options) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const listboxId = `${id}-listbox`
  const popupId = `${id}-popup`
  const getOptionId = (index: number) => `${id}-option-${index}`
  // Focus moving between the field and the popup's own controls (a link
  // under the options) keeps the list open.
  const isInsideCombobox = (target: EventTarget | null) =>
    target instanceof Element &&
    (target.id === id || target.closest(`[id="${popupId}"]`) !== null)
  const isOpen = isFocused && !isDismissed && canOpen
  const hasActive = isOpen && optionCount > 0
  const active = Math.min(activeIndex, optionCount - 1)

  // The active suggestion stays in sight in a long list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the option's id follows `active`
  useEffect(() => {
    if (hasActive) {
      document
        .getElementById(getOptionId(active))
        ?.scrollIntoView({ block: 'nearest' })
    }
  }, [hasActive, active])

  const reset = () => {
    setActiveIndex(0)
    setIsDismissed(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
        if (hasActive) onPick(active)
        return
      // Closes only the list, not a panel the field stands in.
      case 'Escape':
        if (!isOpen) return
        event.preventDefault()
        event.stopPropagation()
        setIsDismissed(true)
        return
    }
  }

  return {
    activeIndex: active,
    getOptionId,
    hasActive,
    inputProps: {
      'aria-activedescendant': hasActive ? getOptionId(active) : undefined,
      'aria-autocomplete': 'list' as const,
      'aria-controls': listboxId,
      'aria-expanded': isOpen,
      autoComplete: 'off',
      id,
      onBlur: (event: FocusEvent<HTMLInputElement>) => {
        if (!isInsideCombobox(event.relatedTarget)) setIsFocused(false)
      },
      // A click opens a list closed with Escape again.
      onClick: () => setIsDismissed(false),
      onFocus: () => {
        setIsFocused(true)
        setIsDismissed(false)
      },
      onKeyDown,
      role: 'combobox' as const,
    },
    isOpen,
    listboxId,
    /** For a popup that holds more than the options, around the listbox. */
    popupProps: {
      id: popupId,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!isInsideCombobox(event.relatedTarget)) setIsFocused(false)
      },
    },
    reset,
  }
}
