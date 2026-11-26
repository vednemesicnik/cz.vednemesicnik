import { type FieldMetadata, useField } from '@conform-to/react'
import { Placeholder } from '@tiptap/extensions'
import { type Extensions, useEditor } from '@tiptap/react'
import { useEffect } from 'react'
import { createEditorContent } from '~/utils/create-editor-content'

type Options = {
  field: FieldMetadata<string | undefined>
  formats: Extensions
  placeholder?: string
  disabled: boolean
}

/**
 * The editor core `TextEditor` and `CaptionEditor` share: Tiptap bound to a
 * Conform field. The editor writes its JSON into the field (an empty editor
 * writes `''`) and validates it on blur.
 *
 * @param options.field - The Conform field the editor reads and writes.
 * @param options.formats - The Tiptap extensions the editor allows; anything
 * else, typed or pasted, stays plain text.
 * @param options.placeholder - Shown while the editor is empty; *Začněte
 * psát...* by default.
 * @param options.disabled - Makes the editor read-only and stops the writes.
 * @returns The editor (`null` until it mounts in the browser) and the id the
 * field's label takes, which names the text field.
 */
export const useTextEditor = ({
  field,
  formats,
  placeholder = 'Začněte psát...',
  disabled,
}: Options) => {
  const [_meta, form] = useField(field.name)
  const labelId = `${field.id}-label`

  const editor = useEditor({
    content: createEditorContent(field.defaultValue),
    editable: !disabled,
    // The text field is named by its label.
    editorProps: {
      attributes: {
        'aria-labelledby': labelId,
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
    extensions: [...formats, Placeholder.configure({ placeholder })],
    immediatelyRender: false,
    onBlur: ({ editor }) => {
      if (!disabled && form.dirty && editor.isEditable) {
        form.validate({ name: field.name })
      }
    },
    onUpdate: ({ editor }) => {
      if (!disabled && editor.isEditable) {
        const newValue = editor.isEmpty ? '' : JSON.stringify(editor.getJSON())
        form.update({ name: field.name, value: newValue })
      }
    },
    shouldRerenderOnTransaction: false,
  })

  // Update editor editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  return { editor, labelId }
}
