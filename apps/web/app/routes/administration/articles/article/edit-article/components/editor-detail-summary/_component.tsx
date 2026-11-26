import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { EditorDetailRow } from '~/components/editor-detail-row'
import { EditorDetailRowName } from '~/components/editor-detail-row-name'
import { EditorDetailRowValue } from '~/components/editor-detail-row-value'

import { useEditorDetail } from '../editor-detail'
import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The phone's row of an `EditorDetail` (24f): the detail's name and its value,
 * as the button that opens the panel. While the panel is open, the row under it
 * is out of reach.
 *
 * @param props.children - The value, `—` when empty.
 */
export const EditorDetailSummary = ({ className, children }: Props) => {
  const { isOpen, name, onOpen, panelId, rowRef } = useEditorDetail()

  return (
    <EditorDetailRow
      aria-controls={panelId}
      aria-expanded={isOpen}
      className={clsx(styles.row, className)}
      inert={isOpen}
      onClick={onOpen}
      ref={rowRef}
    >
      <EditorDetailRowName>{name}</EditorDetailRowName>
      <EditorDetailRowValue>{children}</EditorDetailRowValue>
    </EditorDetailRow>
  )
}
