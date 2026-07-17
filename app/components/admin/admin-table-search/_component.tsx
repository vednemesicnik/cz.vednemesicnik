import { Form, useLocation, useSearchParams } from 'react-router'

import { SearchIcon } from '~/components/icons/search-icon'
import { Link } from '~/components/link'
import {
  ORDER_PARAM,
  SEARCH_PARAM,
  SORT_PARAM,
} from '~/utils/admin-list-params'

import styles from './_styles.module.css'

type Props = {
  defaultValue: string
  placeholder?: string
}

export const AdminTableSearch = ({ defaultValue, placeholder }: Props) => {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()

  const sort = searchParams.get(SORT_PARAM)
  const order = searchParams.get(ORDER_PARAM)

  // Keep the current sort/order but drop `q` and `page` when clearing the search.
  const clearParams = new URLSearchParams()
  if (sort !== null) clearParams.set(SORT_PARAM, sort)
  if (order !== null) clearParams.set(ORDER_PARAM, order)
  const clearSearch = clearParams.toString()

  return (
    <Form className={styles.form} method={'get'}>
      {/* Preserve current sort on GET submit; `page` is omitted to reset to page 1. */}
      {sort !== null && (
        <input name={SORT_PARAM} type={'hidden'} value={sort} />
      )}
      {order !== null && (
        <input name={ORDER_PARAM} type={'hidden'} value={order} />
      )}

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
          to={{ pathname, search: clearSearch ? `?${clearSearch}` : '' }}
        >
          Zrušit
        </Link>
      )}
    </Form>
  )
}
