import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  actions: ReactNode
  alt: string
  children: ReactNode
  previewUrl: string
  toDelete?: boolean
}

export const AdminImagePreviewCard = ({
  actions,
  alt,
  children,
  previewUrl,
  toDelete = false,
}: Props) => {
  return (
    <section className={styles.imagePreview}>
      <div className={styles.actionsContainer}>{actions}</div>
      <div
        className={`${styles.imageContent} ${toDelete ? styles.toDelete : ''}`}
      >
        <img alt={alt} className={styles.previewImage} src={previewUrl} />
        {children}
      </div>
    </section>
  )
}
