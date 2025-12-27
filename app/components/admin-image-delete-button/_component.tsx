import { DeleteIcon } from '~/components/icons/delete-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import styles from './_styles.module.css'

type Props = {
  onClick: () => void
  toDelete: boolean
}

export const AdminImageDeleteButton = ({ onClick, toDelete }: Props) => {
  return (
    <button
      className={`${styles.toggleButton} ${toDelete ? styles.toDelete : ''}`}
      onClick={onClick}
      type={'button'}
    >
      {toDelete ? (
        <RefreshIcon className={styles.icon} />
      ) : (
        <DeleteIcon className={styles.icon} />
      )}
    </button>
  )
}
