import { clsx } from 'clsx'

import { GripVerticalIcon } from '~/components/icons/grip-vertical-icon'
import { useReorderableListRow } from '~/components/reorderable-list'

import styles from './_styles.module.css'

type Props = {
  /** What the handle moves, with its place: „Přesunout odkaz: Spotify. …“. */
  label: string
  className?: string
}

/**
 * The grip of a {@link ReorderableList} row: a button for the keyboard —
 * Space lifts and drops, the arrows move, Escape puts the row back — and
 * where a pointer drag starts. The grip is 16 px, the target 24 × 24 (44 × 44
 * to a finger, o482br61).
 */
export const ReorderableListHandle = ({ label, className }: Props) => {
  const { instructionId, isLifted, onBlur, onKeyDown, setHandle } =
    useReorderableListRow()

  return (
    <button
      aria-describedby={instructionId}
      aria-label={label}
      aria-pressed={isLifted}
      className={clsx(styles.handle, className)}
      data-reorder-handle={true}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      ref={setHandle}
      type={'button'}
    >
      <GripVerticalIcon className={styles.grip} />
    </button>
  )
}
