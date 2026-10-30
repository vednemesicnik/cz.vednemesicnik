import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The bar's action as a submit button that looks like its link, for a switch
 * that posts a form, such as „Zobrazit jako čtenář“ (10d).
 */
export const PreviewBarButton = ({ children }: Props) => (
  <button className={styles.button} type={'submit'}>
    {children}
  </button>
)
