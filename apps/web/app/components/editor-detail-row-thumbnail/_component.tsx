import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  source: string
  className?: string
}

/** One 32 px thumbnail in `EditorDetailRowThumbnails`; decorative. */
export const EditorDetailRowThumbnail = ({ source, className }: Props) => (
  <img
    alt={''}
    className={clsx(styles.editorDetailRowThumbnail, className)}
    src={source}
  />
)
