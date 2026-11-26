import { useRef } from 'react'
import { Link } from 'react-router'

import { Tooltip } from '~/components/tooltip'
import type { SharedFilter } from '~/types/saved-filter'
import { FILTER_PRESET_PARAM } from '~/utils/admin-list-filters'

import styles from './_styles.module.css'

type Props = {
  filter: SharedFilter
  isActive: boolean
  onApply: () => void
}

/**
 * A filter another user shares, in the Uložené filtry menu (design 22d): its
 * name applies it, its owner tells two of the same name apart. A name cut off
 * by the menu's width shows whole in a `Tooltip` (jb81di02).
 */
export const SharedFilterRow = ({ filter, isActive, onApply }: Props) => {
  const nameRef = useRef<HTMLSpanElement>(null)

  return (
    <li>
      <Tooltip
        className={styles.tooltip}
        label={filter.name}
        truncatedRef={nameRef}
      >
        <Link
          className={styles.apply}
          data-active={isActive || undefined}
          onClick={onApply}
          to={`?${filter.query}&${FILTER_PRESET_PARAM}=${filter.id}`}
        >
          <span className={styles.name} ref={nameRef}>
            {filter.name}
          </span>
          {/* Names are unique per user only, so the owner is what tells two
              identically named filters apart. */}
          <span className={styles.owner}>{filter.ownerName}</span>
        </Link>
      </Tooltip>
    </li>
  )
}
