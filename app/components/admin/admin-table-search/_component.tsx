import {
  type ChangeEvent,
  type KeyboardEvent,
  type SubmitEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Form, useSearchParams, useSubmit } from 'react-router'

import { Button } from '~/components/button'
import { CloseIcon } from '~/components/icons/close-icon'
import { SearchIcon } from '~/components/icons/search-icon'
import { PAGE_PARAM } from '~/components/pagination'
import { SEARCH_PARAM } from '~/utils/admin-list-params'
import { buildNonEmptySearchParams } from '~/utils/build-non-empty-search-params'
import { useDebouncedCallback } from '~/utils/use-debounced-callback'
import { useHydrated } from '~/utils/use-hydrated'

import styles from './_styles.module.css'

const SEARCH_DEBOUNCE_MILLISECONDS = 300

type Props = {
  defaultValue: string
  placeholder?: string
}

export const AdminTableSearch = ({ defaultValue, placeholder }: Props) => {
  const [searchParams] = useSearchParams()
  const submit = useSubmit()
  const isHydrated = useHydrated()
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)
  // The raw value of the last submit; the loader hands it back trimmed.
  const lastSubmittedValueRef = useRef(defaultValue)

  // Preserve every current param except `q` (the search input owns it) and
  // `page` (searching/clearing resets to page 1), so sort and any future filters
  // survive a submit or a clear.
  const preserved = new URLSearchParams(searchParams)
  preserved.delete(SEARCH_PARAM)
  preserved.delete(PAGE_PARAM)

  const preservedEntries = [...preserved.entries()]

  // Starting a search adds a history entry, refining or clearing it replaces
  // that entry, so Back returns to the list before the search (qx3tx3bz).
  const submitSearch = (query: string) => {
    const form = formRef.current

    if (form === null) return

    debounced.cancel()
    lastSubmittedValueRef.current = query

    const formData = new FormData(form)
    formData.set(SEARCH_PARAM, query)

    void submit(buildNonEmptySearchParams(formData), {
      method: 'get',
      replace: searchParams.has(SEARCH_PARAM),
    })
  }

  // Search as you type, after a pause (qx3tx3bz).
  const debounced = useDebouncedCallback(
    () => submitSearch(value),
    SEARCH_DEBOUNCE_MILLISECONDS,
  )

  // An emptied field drops the search at once, whichever way it was emptied.
  const submitEmptySearch = () => {
    if (searchParams.has(SEARCH_PARAM)) {
      submitSearch('')
    } else {
      debounced.cancel()
    }
  }

  // The loader's value changes on our own submits too. Only a change that did
  // not come from this field (Back/Forward, a filter preset, a link) rewrites
  // it — otherwise the trimmed echo of an older query would undo what
  // was typed since.
  useEffect(() => {
    if (defaultValue === lastSubmittedValueRef.current.trim()) return

    debounced.cancel()
    lastSubmittedValueRef.current = defaultValue
    setValue(defaultValue)
  }, [debounced, defaultValue])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value

    setValue(nextValue)

    if (nextValue.trim() === '') {
      submitEmptySearch()
    } else {
      debounced.run()
    }
  }

  const handleClear = () => {
    setValue('')
    inputRef.current?.focus()
    submitEmptySearch()
  }

  // Esc clears like the ✕ in every browser; WebKit's own clear is suppressed.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value !== '') {
      event.preventDefault()
      handleClear()
    }
  }

  // Enter searches at once. Without JS the native GET submit runs instead.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearch(value)
  }

  return (
    <Form
      className={styles.form}
      method={'get'}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {/* Carry the preserved params on GET submit so a search doesn't drop them. */}
      {preservedEntries.map(([name, preservedValue], index) => (
        <input
          key={`${name}-${index}`}
          name={name}
          type={'hidden'}
          value={preservedValue}
        />
      ))}

      <div className={styles.field}>
        <span aria-hidden={true} className={styles.icon}>
          <SearchIcon />
        </span>
        <input
          aria-label={'Hledat'}
          className={styles.input}
          name={SEARCH_PARAM}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          type={'search'}
          value={value}
        />
        {/* Our own ✕ replaces the native one in every browser (qx3tx3bz).
            Rendered only once hydrated: without JS it could not clear. */}
        {isHydrated && value !== '' && (
          <button
            aria-label={'Zrušit hledání'}
            className={styles.clear}
            onClick={handleClear}
            type={'button'}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* The no-JS path: the field searches by itself only with JS, so the
          button is hidden via `@media (scripting: enabled)`. */}
      <Button className={styles.submit} type={'submit'} variant={'outline'}>
        Hledat
      </Button>
    </Form>
  )
}
