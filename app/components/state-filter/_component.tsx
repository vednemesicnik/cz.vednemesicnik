import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Item = {
  label: string
  to: ComponentProps<typeof BaseLink>['to']
  isActive: boolean
  count?: number
  attention?: boolean
}

type Props = {
  items: Item[]
  label: string
  className?: string
}

/**
 * The design system's state filter: a list's queues as pills (design 22a),
 * each a link, so a queue has its own address. A queue of work carries its
 * count, grey, or in ink when it waits for the viewer.
 *
 * @param props.label - The group's accessible name, e.g. „Stav“.
 * @param props.items - The pills; `attention` puts the count in ink.
 */
export const StateFilter = ({ items, label, className }: Props) => (
  <nav aria-label={label} className={clsx(styles.stateFilter, className)}>
    {items.map((item) => (
      <BaseLink
        aria-current={item.isActive ? 'page' : undefined}
        className={clsx(styles.item, item.isActive && styles.active)}
        key={item.label}
        preventScrollReset={true}
        to={item.to}
      >
        {item.label}
        {item.count !== undefined && (
          <span
            className={clsx(styles.count, item.attention && styles.attention)}
          >
            {item.count}
          </span>
        )}
      </BaseLink>
    ))}
  </nav>
)
