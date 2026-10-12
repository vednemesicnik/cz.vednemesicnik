import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Chip = {
  label: string
  value: string
  clearSearch: string
}

type Props = {
  chips: Chip[]
  clearAllSearch: string
}

/**
 * The active filters under the toolbar (design 22d), so they stay visible
 * while the Filtry panel is closed. × clears one, Zrušit filtry all of them;
 * the queue and the search stay.
 *
 * @param props.chips - One per active filter, with the search that clears it.
 * @param props.clearAllSearch - The search without any filter.
 */
export const ActiveFilterChips = ({ chips, clearAllSearch }: Props) => (
  <div className={styles.chips}>
    {chips.map((chip) => (
      <span className={styles.chip} key={chip.label}>
        {chip.label}: <span className={styles.value}>{chip.value}</span>
        <BaseLink
          aria-label={`Zrušit filtr ${chip.label}: ${chip.value}`}
          className={styles.clear}
          preventScrollReset={true}
          to={{ search: chip.clearSearch }}
        >
          <span aria-hidden={'true'}>×</span>
        </BaseLink>
      </span>
    ))}
    <BaseLink
      className={styles.clearAll}
      preventScrollReset={true}
      to={{ search: clearAllSearch }}
    >
      Zrušit filtry
    </BaseLink>
  </div>
)
