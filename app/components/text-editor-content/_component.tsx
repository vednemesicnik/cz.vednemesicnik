import { type Editor, EditorContent } from '@tiptap/react'
import './_styles.css'

type Props = {
  editor: Editor
  className?: string
}

/**
 * The text of `TextEditor` and `CaptionEditor`, set as the web sets an
 * article; a root restyles it through Tiptap's global `.tiptap` class.
 */
export const TextEditorContent = ({ editor, className }: Props) => (
  <EditorContent className={className} editor={editor} />
)
