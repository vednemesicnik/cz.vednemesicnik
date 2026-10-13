import { clsx } from 'clsx'
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Form, useNavigate, useSearchParams } from 'react-router'

import { Button } from '~/components/button'
import { Checkbox } from '~/components/checkbox'
import { ArrowDropDownIcon } from '~/components/icons/arrow-drop-down-icon'
import { useHydrated } from '~/utils/use-hydrated'

import { buildListSearch } from '../../utils/build-list-search'
import { foldForSearch } from '../../utils/fold-for-search'
import { getFilterButtonText } from '../../utils/get-filter-button-text'
import styles from './_styles.module.css'

export type FilterOption = {
  value: string
  label: string
  count?: number
  attention?: boolean
}

type Props = {
  label: string
  name: string
  clearLabel: string
  options: FilterOption[]
  selectedValues: string[]
  searchPlaceholder?: string
}

/**
 * One filter of the filter row (design 22d): a button that names the filter
 * and its values, and a menu of them. A click on a value selects only it and
 * closes the menu, its checkbox adds or removes it and keeps the menu open;
 * either applies at once. Without JS the menu is a form of checkboxes.
 *
 * @param props.name - The URL param, repeated for several values.
 * @param props.clearLabel - The first option, which turns the filter off.
 * @param props.options - The values in menu order, which is also their order
 *   in the URL; `count` and `attention` for the Stav menu.
 * @param props.searchPlaceholder - Puts a search field over a long menu.
 */
export const FilterMenu = ({
  label,
  name,
  clearLabel,
  options,
  selectedValues,
  searchPlaceholder,
}: Props) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isHydrated = useHydrated()

  // useId() contains colons, which are invalid in an id/anchor context.
  const baseId = `filter-menu-${useId().replace(/:/g, '')}`
  const popoverId = `${baseId}-popover`
  const listboxId = `${baseId}-listbox`
  const hintId = `${baseId}-hint`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  // Ahead of the URL while a choice loads, so two quick checkbox clicks build
  // on each other; the URL takes over once it arrives.
  const [selected, setSelected] = useState(selectedValues)
  const selectedKey = selectedValues.join('\n')

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by value, not by array identity
  useEffect(() => {
    setSelected(selectedValues)
  }, [selectedKey])

  const foldedSearch = foldForSearch(searchText.trim())
  const visibleOptions =
    foldedSearch === ''
      ? options
      : options.filter((option) =>
          foldForSearch(option.label).includes(foldedSearch),
        )
  // Row 0 clears the filter; the options follow from row 1.
  const rowCount = visibleOptions.length + 1

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label)
  const buttonText = getFilterButtonText(label, selectedLabels)

  useEffect(() => {
    const popover = popoverRef.current

    if (popover === null) return

    const handleToggle = (event: Event) => {
      const isNowOpen = (event as ToggleEvent).newState === 'open'

      setIsOpen(isNowOpen)

      if (!isNowOpen) {
        setSearchText('')
        return
      }

      // Opens on the first selected value, so a long menu starts where it is.
      const firstSelectedIndex = options.findIndex((option) =>
        selected.includes(option.value),
      )
      setActiveIndex(firstSelectedIndex === -1 ? 0 : firstSelectedIndex + 1)
      ;(searchRef.current ?? listboxRef.current)?.focus()
    }

    popover.addEventListener('toggle', handleToggle)

    return () => popover.removeEventListener('toggle', handleToggle)
  }, [options, selected])

  useEffect(() => {
    if (!isOpen) return

    document
      .getElementById(optionId(activeIndex))
      ?.scrollIntoView({ block: 'nearest' })
  })

  // Values go to the URL in menu order, so equal filters give equal URLs.
  const apply = (values: string[]) => {
    const orderedValues = options
      .map((option) => option.value)
      .filter((value) => values.includes(value))

    setSelected(orderedValues)
    void navigate(
      { search: buildListSearch(searchParams, { [name]: orderedValues }) },
      { preventScrollReset: true },
    )
  }

  const close = () => {
    // Guard the method too: it is undefined where the Popover API is absent.
    popoverRef.current?.hidePopover?.()
    triggerRef.current?.focus()
  }

  const selectOnly = (rowIndex: number) => {
    apply(rowIndex === 0 ? [] : [visibleOptions[rowIndex - 1].value])
    close()
  }

  const toggle = (rowIndex: number) => {
    if (rowIndex === 0) {
      apply([])
      return
    }

    const { value } = visibleOptions[rowIndex - 1]

    apply(
      selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value],
    )
  }

  const moveActive = (key: string) => {
    const nextIndex = {
      ArrowDown: Math.min(activeIndex + 1, rowCount - 1),
      ArrowUp: Math.max(activeIndex - 1, 0),
      End: rowCount - 1,
      Home: 0,
    }[key]

    if (nextIndex === undefined) return false

    setActiveIndex(nextIndex)
    return true
  }

  // Space adds or removes, Enter selects only this one; Esc is the popover's.
  const handleListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (moveActive(event.key)) {
      event.preventDefault()
    } else if (event.key === ' ') {
      event.preventDefault()
      toggle(activeIndex)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectOnly(activeIndex)
    }
  }

  // The field types; the arrows go down into the list, Enter takes the first
  // match.
  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(visibleOptions.length > 0 ? 1 : 0)
      listboxRef.current?.focus()
    } else if (event.key === 'Enter' && visibleOptions.length > 0) {
      event.preventDefault()
      selectOnly(1)
    }
  }

  const handleCheckboxClick = (event: MouseEvent, rowIndex: number) => {
    // The row's own click would select only this value and close the menu.
    event.stopPropagation()
    setActiveIndex(rowIndex)
    toggle(rowIndex)
  }

  // The no-JS form carries every other param; the filter is its checkboxes.
  const preservedEntries = [
    ...new URLSearchParams(
      buildListSearch(searchParams, { [name]: undefined }),
    ).entries(),
  ]

  return (
    <div className={styles.filterMenu}>
      <button
        aria-controls={popoverId}
        aria-expanded={isOpen}
        aria-haspopup={'listbox'}
        aria-label={buttonText.accessibleName}
        className={clsx(
          styles.trigger,
          selectedLabels.length > 0 && styles.isSet,
        )}
        popoverTarget={popoverId}
        ref={triggerRef}
        type={'button'}
      >
        <span className={styles.face}>
          <span className={styles.label}>
            {label}
            {buttonText.values !== '' && ': '}
          </span>
          {buttonText.values !== '' && (
            <span className={styles.values}>{buttonText.values}</span>
          )}
          {buttonText.more !== '' && (
            <span className={styles.more}>{buttonText.more}</span>
          )}
          <span aria-hidden={'true'} className={styles.chevron}>
            <ArrowDropDownIcon />
          </span>
        </span>
      </button>

      {/* Native popover: the trigger (its popovertarget invoker) becomes the
          implicit anchor, so the menu is positioned in CSS. */}
      <div
        className={styles.popover}
        id={popoverId}
        popover={'auto'}
        ref={popoverRef}
      >
        {isHydrated ? (
          <>
            {searchPlaceholder !== undefined && (
              <input
                aria-autocomplete={'list'}
                aria-controls={listboxId}
                aria-expanded={true}
                aria-label={searchPlaceholder}
                className={styles.search}
                onChange={(event) => {
                  setSearchText(event.currentTarget.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                ref={searchRef}
                role={'combobox'}
                type={'search'}
                value={searchText}
              />
            )}
            <div
              aria-activedescendant={optionId(activeIndex)}
              aria-describedby={hintId}
              aria-label={label}
              aria-multiselectable={'true'}
              className={styles.listbox}
              id={listboxId}
              onKeyDown={handleListboxKeyDown}
              ref={listboxRef}
              role={'listbox'}
              tabIndex={0}
            >
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: the listbox owns the keys */}
              {/* biome-ignore lint/a11y/useFocusableInteractive: the listbox keeps the focus, aria-activedescendant points here */}
              <div
                aria-selected={selected.length === 0}
                className={clsx(
                  styles.option,
                  styles.clearOption,
                  activeIndex === 0 && styles.isActive,
                )}
                id={optionId(0)}
                onClick={() => selectOnly(0)}
                role={'option'}
              >
                <span aria-hidden={'true'} className={styles.checkboxTarget} />
                {clearLabel}
              </div>
              {visibleOptions.map((option, index) => {
                const rowIndex = index + 1
                const isSelected = selected.includes(option.value)

                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: the listbox owns the keys
                  // biome-ignore lint/a11y/useFocusableInteractive: the listbox keeps the focus, aria-activedescendant points here
                  <div
                    aria-selected={isSelected}
                    className={clsx(
                      styles.option,
                      activeIndex === rowIndex && styles.isActive,
                    )}
                    id={optionId(rowIndex)}
                    key={option.value}
                    onClick={() => selectOnly(rowIndex)}
                    role={'option'}
                  >
                    {/* A drawing for readers; Space is its key. */}
                    <span
                      aria-hidden={'true'}
                      className={styles.checkboxTarget}
                      onClick={(event) => handleCheckboxClick(event, rowIndex)}
                    >
                      <span className={styles.checkbox} />
                    </span>
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.count !== undefined && (
                      <span
                        className={clsx(
                          styles.count,
                          option.attention && styles.attention,
                        )}
                      >
                        <span className={'screen-reader-only'}>, </span>
                        {option.count}
                        {option.attention && (
                          <span className={'screen-reader-only'}>
                            , čekají na vás
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className={'screen-reader-only'} id={hintId}>
              Mezerníkem hodnotu přidáte nebo odeberete. Enterem vyberete jen
              tuto hodnotu a zavřete nabídku.
            </p>
          </>
        ) : (
          <Form className={styles.fallbackForm} method={'get'}>
            {preservedEntries.map(([preservedName, value], index) => (
              <input
                key={`${preservedName}-${index}`}
                name={preservedName}
                type={'hidden'}
                value={value}
              />
            ))}
            <fieldset className={styles.fallbackFieldset}>
              <legend className={'screen-reader-only'}>{label}</legend>
              {options.map((option) => (
                <Checkbox
                  defaultChecked={selectedValues.includes(option.value)}
                  key={option.value}
                  name={name}
                  value={option.value}
                >
                  {option.label}
                  {option.count !== undefined && ` (${option.count})`}
                </Checkbox>
              ))}
            </fieldset>
            <Button size={'sm'} type={'submit'} variant={'outline'}>
              Filtrovat
            </Button>
          </Form>
        )}
      </div>
    </div>
  )
}
