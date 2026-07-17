import { useCallback } from 'react'

import styles from './_styles.module.css'

type Props = {
  checked: boolean
  // DOM-only property (no HTML attribute), so it is set imperatively via a ref.
  indeterminate: boolean
  onChange: () => void
  // No selectable rows on this page.
  disabled?: boolean
}

export const TableSelectionHeaderCell = ({
  checked,
  indeterminate,
  onChange,
  disabled = false,
}: Props) => {
  const setRef = useCallback(
    (input: HTMLInputElement | null) => {
      if (input !== null) input.indeterminate = indeterminate
    },
    [indeterminate],
  )

  return (
    <th className={styles.headerCell}>
      <input
        aria-label={'Vybrat vše'}
        checked={checked}
        className={styles.checkbox}
        disabled={disabled}
        onChange={onChange}
        ref={setRef}
        type={'checkbox'}
      />
    </th>
  )
}
