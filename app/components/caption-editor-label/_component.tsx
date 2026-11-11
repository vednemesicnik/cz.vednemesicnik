import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useCaptionEditor } from '~/components/caption-editor'
import { Label } from '~/components/label'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A `CaptionEditor`'s visible label, set small as the image tile's alt field
 * (24b): it names the editor and points at its hidden input; the asterisk
 * follows the field's `required`.
 *
 * @param props.children - The label, e.g. „Popisek“
 * @returns The `<label>`
 */
export const CaptionEditorLabel = ({ children, className }: Props) => {
  const { inputId, labelId, required } = useCaptionEditor()

  return (
    <Label
      className={clsx(styles.label, className)}
      htmlFor={inputId}
      id={labelId}
      required={required}
    >
      {children}
    </Label>
  )
}
