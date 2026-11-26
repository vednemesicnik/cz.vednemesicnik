import { clsx } from 'clsx'

import { AdminTableSearch } from '~/components/admin/admin-table-search'

import styles from './_styles.module.css'

type Props = {
  defaultValue: string
  placeholder: string
  className?: string
}

/**
 * The search of a filter bar: it grows into the row's free space, 240–480 px
 * (22a, cioukqn6), and takes the whole row on a phone (22g).
 *
 * @returns The search field in its slot
 */
export const FilterBarSearch = ({
  defaultValue,
  placeholder,
  className,
}: Props) => (
  <div className={clsx(styles.filterBarSearch, className)}>
    <AdminTableSearch
      defaultValue={defaultValue}
      grow={true}
      placeholder={placeholder}
    />
  </div>
)
