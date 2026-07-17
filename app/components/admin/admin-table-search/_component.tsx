import { Form, useLocation, useSearchParams } from 'react-router'

import { SearchIcon } from '~/components/icons/search-icon'
import { Link } from '~/components/link'
import { PAGE_PARAM } from '~/components/pagination'
import { SEARCH_PARAM } from '~/utils/admin-list-params'

import styles from './_styles.module.css'

type Props = {
  defaultValue: string
  placeholder?: string
}

export const AdminTableSearch = ({ defaultValue, placeholder }: Props) => {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()

  // Preserve every current param except `q` (the search input owns it) and
  // `page` (searching/clearing resets to page 1), so sort and any future filters
  // survive a submit or a clear.
  const preserved = new URLSearchParams(searchParams)
  preserved.delete(SEARCH_PARAM)
  preserved.delete(PAGE_PARAM)

  const preservedEntries = [...preserved.entries()]
  const preservedSearch = preserved.toString()

  return (
    <Form className={styles.form} method={'get'}>
      {/* Carry the preserved params on GET submit so a search doesn't drop them. */}
      {preservedEntries.map(([name, value], index) => (
        <input
          key={`${name}-${index}`}
          name={name}
          type={'hidden'}
          value={value}
        />
      ))}

      <div className={styles.field}>
        <span aria-hidden={true} className={styles.icon}>
          <SearchIcon />
        </span>
        <input
          // `key` resyncs the input value when navigating back/forward.
          aria-label={'Hledat'}
          className={styles.input}
          defaultValue={defaultValue}
          key={defaultValue}
          name={SEARCH_PARAM}
          placeholder={placeholder}
          type={'search'}
        />
      </div>

      <button className={styles.submit} type={'submit'}>
        Hledat
      </button>

      {defaultValue !== '' && (
        <Link
          className={styles.clear}
          to={{
            pathname,
            search: preservedSearch ? `?${preservedSearch}` : '',
          }}
        >
          Zrušit
        </Link>
      )}
    </Form>
  )
}
