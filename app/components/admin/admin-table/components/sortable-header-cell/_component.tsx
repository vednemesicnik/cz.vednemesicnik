import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'

import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { Link } from '~/components/link'
import {
  buildSortSearch,
  ORDER_PARAM,
  SORT_PARAM,
  type SortOrder,
} from '~/utils/admin-list-params'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  sortKey: string
  // The loader's default sort key; renders this column as active (aria-sort +
  // indicator) when no `sort` param is present. Toggling back to it clears params.
  defaultSort?: string
}

export const TableSortableHeaderCell = ({
  children,
  sortKey,
  defaultSort,
}: Props) => {
  const [searchParams] = useSearchParams()

  const activeSort = searchParams.get(SORT_PARAM) ?? defaultSort
  const isActive = activeSort === sortKey
  const order: SortOrder =
    searchParams.get(ORDER_PARAM) === 'desc' ? 'desc' : 'asc'

  const search = buildSortSearch(searchParams.toString(), sortKey)

  return (
    <th
      aria-sort={
        isActive ? (order === 'asc' ? 'ascending' : 'descending') : undefined
      }
      className={styles.headerCell}
    >
      <Link className={styles.link} preventScrollReset={true} to={{ search }}>
        {children}
        <ArrowUpwardIcon
          className={clsx(
            styles.icon,
            isActive && styles.iconActive,
            isActive && order === 'desc' && styles.iconDesc,
          )}
        />
      </Link>
    </th>
  )
}
