import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The toolbar over `TextEditor`'s text (design 24a): groups of
 * `TextEditorToolbarButton`s in a row that stays at the top of the field while
 * the text scrolls, and scrolls sideways on a phone (24f). Each button is a
 * stop of its own, so no `toolbar` role, which would promise arrow keys.
 */
export const TextEditorToolbar = ({ children }: Props) => (
  <div className={styles.toolbar}>{children}</div>
)
