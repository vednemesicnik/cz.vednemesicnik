import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { ChevronRightIcon } from '~/components/icons/chevron-right-icon'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'button'>, 'type'>

/**
 * The design system's `EditorDetailRow` (design 24f, u94oosdp): a detail of
 * the phone's editor as one button that opens it, its name
 * (`EditorDetailRowName`) and value (`EditorDetailRowValue`), then a chevron.
 * At least 48 px high, toned while pressed, a hairline under it.
 */
export const EditorDetailRow = ({ children, className, ...rest }: Props) => (
  <button
    className={clsx(styles.editorDetailRow, className)}
    type={'button'}
    {...rest}
  >
    {children}
    <ChevronRightIcon className={styles.chevron} />
  </button>
)
