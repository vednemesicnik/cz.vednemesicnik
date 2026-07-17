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
  // The loader's default order, used as the fallback whenever the `order` param is
  // missing/invalid (mirrors parseAdminListParams) so the UI matches the loader.
  defaultOrder?: SortOrder
}

export const TableSortableHeaderCell = ({
  children,
  sortKey,
  defaultSort,
  defaultOrder,
}: Props) => {
  const [searchParams] = useSearchParams()

  // Treat an empty value (e.g. `?sort=`) as missing, matching the loader's
  // fallback to defaultSort.
  const rawSort = searchParams.get(SORT_PARAM) || undefined
  const rawOrder = searchParams.get(ORDER_PARAM)

  const isActive = (rawSort ?? defaultSort) === sortKey
  // Mirror parseAdminListParams: a valid order param wins, otherwise fall back to
  // the loader's default order — so aria-sort/arrow can't disagree with the loader.
  const order: SortOrder =
    rawOrder === 'asc' || rawOrder === 'desc'
      ? rawOrder
      : (defaultOrder ?? 'asc')

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
        {/* Decorative: sort state is already conveyed by aria-sort. */}
        <span aria-hidden={true} className={styles.iconWrapper}>
          <ArrowUpwardIcon
            className={clsx(
              styles.icon,
              isActive && styles.iconActive,
              isActive && order === 'desc' && styles.iconDesc,
            )}
          />
        </span>
      </Link>
    </th>
  )
}
