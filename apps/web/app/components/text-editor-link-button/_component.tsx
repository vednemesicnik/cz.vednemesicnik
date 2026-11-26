import { type Editor, useEditorState } from '@tiptap/react'
import { LinkIcon } from '~/components/icons/link-icon'
import { TextEditorToolbarButton } from '~/components/text-editor-toolbar-button'

type Props = {
  editor: Editor
  className?: string
}

const toggleLink = (editor: Editor) => {
  // Get current URL if link is active
  const previousUrl = editor.getAttributes('link').href || ''

  // Prompt for URL (works for both adding and editing)
  const url = window.prompt('Zadejte URL:', previousUrl)

  // If cancelled, do nothing
  if (url === null) {
    return
  }

  // If empty string, remove the link
  if (url === '') {
    editor.chain().focus().unsetLink().run()
    return
  }

  // Set or update the link
  editor.chain().focus().setLink({ href: url }).run()
}

/**
 * The link tool of `TextEditor`'s toolbar and of `CaptionEditor`: asks for the
 * address, edits the link under the cursor, and an empty address removes it.
 */
export const TextEditorLinkButton = ({ editor, className }: Props) => {
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canSetLink: editor.can().setLink({ href: '' }),
      canUnsetLink: editor.can().unsetLink(),
      isActiveLink: editor.isActive('link'),
    }),
  })

  return (
    <TextEditorToolbarButton
      active={editorState.isActiveLink}
      className={className}
      disabled={
        editorState.isActiveLink
          ? !editorState.canUnsetLink
          : !editorState.canSetLink
      }
      label={'Odkaz'}
      onClick={() => toggleLink(editor)}
    >
      <LinkIcon />
    </TextEditorToolbarButton>
  )
}
