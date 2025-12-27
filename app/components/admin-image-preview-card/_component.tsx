import type { ReactNode } from 'react'

import { AdminButton } from '~/components/admin-button'
import { DeleteIcon } from '~/components/icons/delete-icon'

import styles from './_styles.module.css'

type Props = {
  alt: string
  children: ReactNode
  onDelete: () => void
  previewUrl: string
}

export const AdminImagePreviewCard = ({
  alt,
  children,
  onDelete,
  previewUrl,
}: Props) => {
  return (
    <section className={styles.imagePreview}>
      <AdminButton
        className={styles.deleteButton}
        onClick={onDelete}
        type={'button'}
        variant={'danger'}
      >
        <DeleteIcon className={styles.deleteIcon} />
      </AdminButton>
      <img alt={alt} className={styles.previewImage} src={previewUrl} />
      {children}
    </section>
  )
}
