import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Button } from '~/components/button'

import { useEditorDetail } from '../editor-detail'
import styles from './_styles.module.css'

type Props = {
  /** The field's own label names it on wider screens, so no heading there. */
  isNameHidden?: boolean
  className?: string
  children: ReactNode
}

/**
 * The bar of an `EditorDetailPanel`: the detail's name as the panel's heading,
 * the save line under it, and *Hotovo*, which only closes. The save line and
 * *Hotovo* show on a phone only (24f).
 *
 * @param props.children - The editor's save line (940ikr3o).
 */
export const EditorDetailBar = ({
  isNameHidden = false,
  className,
  children,
}: Props) => {
  const { headingId, headingRef, isOpen, name, onClose } = useEditorDetail()

  return (
    <div
      className={clsx(
        styles.bar,
        isOpen && styles.isOpen,
        isNameHidden && styles.isNameHidden,
        className,
      )}
    >
      <div className={styles.barTitle}>
        <h2
          className={styles.name}
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
        >
          {name}
        </h2>
        <div className={styles.saveLine}>{children}</div>
      </div>
      <Button
        className={styles.done}
        onClick={onClose}
        size={'sm'}
        type={'button'}
        variant={'outline'}
      >
        Hotovo
      </Button>
    </div>
  )
}
