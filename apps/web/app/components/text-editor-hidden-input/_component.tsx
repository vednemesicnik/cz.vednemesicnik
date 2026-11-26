import { type FieldMetadata, getInputProps } from '@conform-to/react'
import type { Editor } from '@tiptap/react'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import styles from './_styles.module.css'

type Props = ComponentProps<'input'> & {
  field: FieldMetadata<string | undefined>
  editor: Editor | null
}

/**
 * The form's input behind a text editor: it carries the editor's JSON on
 * submit, and when the form focuses it (an invalid field), it hands the focus
 * to the editor.
 */
export const TextEditorHiddenInput = ({
  field,
  editor,
  className,
  ...rest
}: Props) => (
  <input
    {...getInputProps(field, { type: 'text' })}
    {...rest}
    aria-hidden="true"
    className={clsx(styles.hiddenInput, className)}
    onFocus={() => editor?.commands.focus()}
    tabIndex={-1}
  />
)
