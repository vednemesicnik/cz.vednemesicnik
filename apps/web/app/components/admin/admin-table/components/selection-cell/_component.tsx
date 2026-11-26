import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  checked: boolean
  onChange: () => void
  // Row not deletable.
  disabled?: boolean
  // Accessible label naming the row, e.g. `Vybrat článek ${title}`.
  label: string
  className?: string
}

export const TableSelectionCell = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: Props) => {
  return (
    <td className={clsx(styles.cell, className)}>
      <input
        aria-label={label}
        checked={checked}
        className={styles.checkbox}
        disabled={disabled}
        onChange={onChange}
        type={'checkbox'}
      />
    </td>
  )
}
