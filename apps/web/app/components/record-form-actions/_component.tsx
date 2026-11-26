import type { MouseEvent, ReactNode } from 'react'

import { LinkButton } from '~/components/link-button'
import styles from './_styles.module.css'

type Props = {
  cancelPath: string
  onCancel: (event: MouseEvent) => void
  disabled: boolean
  children: ReactNode
}

/**
 * The actions under a record's add or edit form (design 25c, 28c): Zrušit, a link
 * back, then the submit buttons, the primary last at the right edge, as in
 * Dialog. Below 768 px they stack full width with the primary on top.
 *
 * @param props.cancelPath - Where Zrušit leads.
 * @param props.onCancel - Lets Zrušit go back in history instead.
 * @param props.children - The submit buttons, primary last.
 */
export const RecordFormActions = ({
  cancelPath,
  onCancel,
  disabled,
  children,
}: Props) => (
  <div className={styles.actions}>
    <LinkButton
      disabled={disabled}
      onClick={onCancel}
      replace={true}
      to={cancelPath}
      variant={'ghost'}
    >
      Zrušit
    </LinkButton>
    {children}
  </div>
)
