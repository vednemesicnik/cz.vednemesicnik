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
  // Optional allowlist of valid sort keys (the same one passed to
  // parseAdminListParams). When given, an unknown `sort` value is treated as
  // missing so the default column stays active, matching the loader.
  sortKeys?: readonly string[]
}

export const TableSortableHeaderCell = ({
  children,
  sortKey,
  defaultSort,
  defaultOrder,
  sortKeys,
}: Props) => {
  const [searchParams] = useSearchParams()

  // Treat an empty (`?sort=`) or unknown (`?sort=evil`, when an allowlist is
  // given) value as missing, matching the loader's fallback to defaultSort.
  const sortParam = searchParams.get(SORT_PARAM) || undefined
  const rawSort =
    sortParam !== undefined && sortKeys !== undefined
      ? sortKeys.includes(sortParam)
        ? sortParam
        : undefined
      : sortParam
  const rawOrder = searchParams.get(ORDER_PARAM)
  const orderParamValid = rawOrder === 'asc' || rawOrder === 'desc'

  const isActive = (rawSort ?? defaultSort) === sortKey
  // Mirror parseAdminListParams: a valid order param wins, otherwise fall back to
  // the loader's default order — so aria-sort/arrow can't disagree with the loader.
  const order: SortOrder = orderParamValid ? rawOrder : (defaultOrder ?? 'asc')

  // When this column is the explicit active sort but the order param is
  // missing/invalid, normalize it to the effective order so the toggle cycle
  // (asc → desc → clear) matches what the user sees. The default column active
  // via `defaultSort` (no sort param) is left untouched so its first click still
  // sets an explicit order.
  const searchToToggle = new URLSearchParams(searchParams)
  if (rawSort === sortKey && !orderParamValid) {
    searchToToggle.set(ORDER_PARAM, order)
  }
  const search = buildSortSearch(searchToToggle.toString(), sortKey)

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
