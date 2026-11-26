import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  className?: string
}

/**
 * What the asterisk means, before a form's first field (design system's
 * `.vdm-form__legend`). Hidden from readers: they get no asterisk to explain,
 * the input's `required` tells them.
 */
export const FormLegend = ({ className }: Props) => (
  <p aria-hidden={true} className={clsx(styles.legend, className)}>
    <span className={styles.mark}>*</span> označuje povinnou položku.
  </p>
)
