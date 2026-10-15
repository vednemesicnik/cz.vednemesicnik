import { clsx } from 'clsx'

import type { ListNoun } from '~/config/list-noun-config'
import { formatListCount } from '~/utils/format-list-count'

import styles from './_styles.module.css'

type Props = {
  count: number
  noun: ListNoun
  className?: string
}

/**
 * How many records a list holds, under a table that fits on one page (design
 * 25a); a longer list says it in its pagination.
 *
 * @param props.noun - The list's noun, declined by the count (`7 rubrik`).
 */
export const ListCount = ({ count, noun, className }: Props) => (
  <p className={clsx(styles.listCount, className)}>
    {formatListCount(count, noun)}
  </p>
)
