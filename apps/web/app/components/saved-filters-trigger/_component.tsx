import { clsx } from 'clsx'
import { useRef } from 'react'

import { Button } from '~/components/button'
import { useFilterBar } from '~/components/filter-bar'
import { Tooltip } from '~/components/tooltip'

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
  const textRef = useRef<HTMLSpanElement>(null)
  const label =
    matchingFilterName === undefined
      ? 'Uložené filtry'
      : `Uložené filtry: ${matchingFilterName}`

  return (
    // A long filter name is cut off; the Tooltip shows it whole (jb81di02).
    <Tooltip
      className={clsx(
        styles.tooltip,
        placement === 'row-end' ? styles.rowEnd : styles.inFilters,
      )}
      label={label}
      truncatedRef={textRef}
    >
      <Button
        className={styles.trigger}
        popoverTarget={savedFiltersMenuId}
        size={'sm'}
        type={'button'}
        variant={'outline'}
      >
        <span className={styles.text} ref={textRef}>
          {label}
        </span>
      </Button>
    </Tooltip>
  )
}
