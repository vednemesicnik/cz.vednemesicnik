import { clsx } from 'clsx'

import { Button } from '~/components/button'
import { useFilterBar } from '~/components/filter-bar'

import styles from './_styles.module.css'

type Props = {
  matchingFilterName: string | undefined
  placement: 'row-end' | 'filters'
}

/**
 * The Uložené filtry button (design 22d): its name, or with the saved filter
 * the current filters match exactly, „Uložené filtry: Rozpracované“. The
 * filter bar places it twice, both opening the one menu: at the end of the
 * row on a wide screen and at the end of the scrolling filters on a phone
 * (22g).
 *
 * @param props.placement - `row-end` shows from 768 px, `filters` below it.
 */
export const SavedFiltersTrigger = ({
  matchingFilterName,
  placement,
}: Props) => {
  const { savedFiltersMenuId } = useFilterBar()

  return (
    <Button
      className={clsx(
        styles.trigger,
        placement === 'row-end' ? styles.rowEnd : styles.inFilters,
      )}
      popoverTarget={savedFiltersMenuId}
      size={'sm'}
      type={'button'}
      variant={'outline'}
    >
      <span className={styles.text}>
        {matchingFilterName === undefined
          ? 'Uložené filtry'
          : `Uložené filtry: ${matchingFilterName}`}
      </span>
    </Button>
  )
}
