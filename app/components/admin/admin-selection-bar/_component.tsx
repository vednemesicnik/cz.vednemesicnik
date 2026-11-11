import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Props = {
  count: number
  onClear: () => void
  children: ReactNode
  className?: string
}

/**
 * The bar a list shows while rows are selected (design 22c): „Vybráno: N“, the
 * bulk actions valid for every selected row, and „Zrušit výběr“ at the end.
 *
 * @param props.count - How many rows are selected.
 * @param props.onClear - Clears the selection.
 * @param props.children - `AdminSelectionBarActions`, or an
 *   `AdminSelectionBarMessage` when no action applies to the whole selection.
 */
export const AdminSelectionBar = ({
  count,
  onClear,
  children,
  className,
}: Props) => (
  <section aria-label={'Hromadné akce'} className={clsx(styles.bar, className)}>
    <span className={styles.count}>Vybráno: {count}</span>
    <span aria-hidden={true} className={styles.divider} />
    {children}
    <Button
      className={styles.clear}
      onClick={onClear}
      size={'sm'}
      type={'button'}
      variant={'ghost'}
    >
      Zrušit výběr
    </Button>
  </section>
)
