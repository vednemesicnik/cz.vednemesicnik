import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  action: ReactNode
  children: ReactNode
  title: string
  disabled?: boolean
}

export const AdminImageUploadCard = ({
  action,
  children,
  title,
  disabled,
}: Props) => {
  return (
    <fieldset className={styles.container} disabled={disabled}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {action}
      </div>
      {children}
    </fieldset>
  )
}
