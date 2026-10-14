import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Props = {
  count: number
  onClear: () => void
  children?: ReactNode
  message?: string | null
  className?: string
}

/**
 * The bar a list shows while rows are selected (design 22c): „Vybráno: N“, the
 * bulk actions valid for every selected row, and „Zrušit výběr“ at the end.
 *
 * @param props.count - How many rows are selected.
 * @param props.onClear - Clears the selection.
 * @param props.children - The bulk actions, outline `sm` buttons.
 * @param props.message - Stands in place of the actions when none applies to
 *   the whole selection, e.g. „Pro tento výběr není společná akce.“
 */
export const AdminSelectionBar = ({
  count,
  onClear,
  children,
  message = null,
  className,
}: Props) => (
  <section aria-label={'Hromadné akce'} className={clsx(styles.bar, className)}>
    <span className={styles.count}>Vybráno: {count}</span>
    <span aria-hidden={true} className={styles.divider} />
    {message === null ? (
      <span className={styles.actions}>{children}</span>
    ) : (
      <span className={styles.message}>{message}</span>
    )}
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
