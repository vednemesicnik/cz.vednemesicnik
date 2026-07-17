import styles from './_styles.module.css'

type Props = {
  checked: boolean
  onChange: () => void
  // Row not deletable.
  disabled?: boolean
  // Accessible label naming the row, e.g. `Vybrat článek ${title}`.
  label: string
}

export const TableSelectionCell = ({
  checked,
  onChange,
  disabled = false,
  label,
}: Props) => {
  return (
    <td className={styles.cell}>
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
