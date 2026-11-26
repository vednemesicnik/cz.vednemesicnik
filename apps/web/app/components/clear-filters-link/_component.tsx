import { clsx } from 'clsx'
import { useSearchParams } from 'react-router'

import { Link } from '~/components/link'
import { buildClearFiltersSearch } from '~/utils/build-clear-filters-search'

import styles from './_styles.module.css'

type Props = {
  className?: string
}

/**
 * Zrušit filtry at the end of the filter row (design 22d): back to the
 * list's default, marked explicitly unfiltered so a default saved filter is
 * not applied again. The list shows it only when something differs from the
 * default.
 *
 * @returns The link
 */
export const ClearFiltersLink = ({ className }: Props) => {
  const [searchParams] = useSearchParams()

  return (
    <Link
      className={clsx(styles.clearFiltersLink, className)}
      preventScrollReset={true}
      to={{ search: buildClearFiltersSearch(searchParams) }}
    >
      Zrušit filtry
    </Link>
  )
}
