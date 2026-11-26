import { clsx } from 'clsx'
import styles from './_styles.module.css'

type Props = {
  variant?: 'primary' | 'secondary'
}

export const Divider = ({ variant = 'primary' }: Props) => {
  return (
    <hr
      className={clsx(
        styles.divider,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
      )}
    />
  )
}
