import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { useEffect } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { LinkIcon } from '~/components/icons/link-icon'
import { RedoIcon } from '~/components/icons/redo-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { Label } from '~/components/label'
import { createEditorContent } from '~/utils/create-editor-content'
import styles from './_styles.module.css'
import './_styles.css'
import { type FieldMetadata, getInputProps, useField } from '@conform-to/react'
import { Toolbar } from './components/toolbar'
import { ToolbarButton } from './components/toolbar-button'

type ToolOption =
  | 'bold'
  | 'italic'
  | 'link'
  | 'h2'
  | 'h3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'hardBreak'
  | 'undo'
  | 'redo'

type Props = {
  label: string
  className?: string
  inputProps: ComponentProps<'input'>
  field: FieldMetadata<string | undefined>
  toolbar?: ToolOption[]
}

export const AdminTextEditor = ({
  label,
  field,
  inputProps: {
    className: inputClassName,
    required: inputRequired,
    placeholder: inputPlaceholder,
    disabled: inputDisabled = false,
    ...restInputProps
  },
  className,
  toolbar = [
    'bold',
    'italic',
    'link',
    'h2',
    'h3',
    'bulletList',
    'orderedList',
    'blockquote',
    'hardBreak',
    'undo',
    'redo',
  ],
}: Props) => {
  const [_meta, form] = useField(field.name)
  const hasErrors = field.errors !== undefined && field.errors.length > 0

  const editor = useEditor({
    content: createEditorContent(field.defaultValue),
    editable: !inputDisabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        link: {
          autolink: true,
          defaultProtocol: 'https',
          enableClickSelection: true,
          HTMLAttributes: { rel: 'noopener', target: '_blank' },
          linkOnPaste: true,
          openOnClick: false,
          protocols: ['mailto', 'tel'],
        },
      }),
      Placeholder.configure({
        placeholder: inputPlaceholder ?? 'Začněte psát...',
      }),
    ],
    immediatelyRender: false,
    onBlur: ({ editor }) => {
      if (!inputDisabled && form.dirty && editor.isEditable) {
        form.validate({ name: field.name })
      }
    },
    onUpdate: ({ editor }) => {
      if (!inputDisabled && editor.isEditable) {
        const newValue = editor.isEmpty ? '' : JSON.stringify(editor.getJSON())
        form.update({ name: field.name, value: newValue })
      }
    },
    shouldRerenderOnTransaction: false,
  })

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canRedo: editor?.can().redo() ?? false,
      canSetHardBreak: editor?.can().setHardBreak() ?? false,
      canSetLink: editor?.can().setLink({ href: '' }) ?? false,
      canToggleBlockquote: editor?.can().toggleBlockquote() ?? false,
      canToggleBold: editor?.can().toggleBold() ?? false,
      canToggleBulletList: editor?.can().toggleBulletList() ?? false,
      canToggleH2: editor?.can().toggleHeading({ level: 2 }) ?? false,
      canToggleH3: editor?.can().toggleHeading({ level: 3 }) ?? false,
      canToggleItalic: editor?.can().toggleItalic() ?? false,
      canToggleOrderedList: editor?.can().toggleOrderedList() ?? false,
      canUndo: editor?.can().undo() ?? false,
      canUnsetLink: editor?.can().unsetLink() ?? false,
      isActiveBlockquote: editor?.isActive('blockquote') ?? false,
      isActiveBold: editor?.isActive('bold') ?? false,
      isActiveBulletList: editor?.isActive('bulletList') ?? false,
      isActiveH2: editor?.isActive('heading', { level: 2 }) ?? false,
      isActiveH3: editor?.isActive('heading', { level: 3 }) ?? false,
      isActiveItalic: editor?.isActive('italic') ?? false,
      isActiveLink: editor?.isActive('link') ?? false,
      isActiveOrderedList: editor?.isActive('orderedList') ?? false,
    }),
  })

  // Update editor editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!inputDisabled)
    }
  }, [editor, inputDisabled])

  const handleToggleLink = () => {
    if (!editor) return

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

  return (
    <section className={clsx(styles.container, className)}>
      <Label htmlFor={field.id} required={inputRequired}>
        {label}
      </Label>

      <div
        className={clsx(styles.editorWrapper, hasErrors && styles.editorError)}
      >
        {editor && (
          <>
            <Toolbar>
              {toolbar?.includes('bold') && (
                <ToolbarButton
                  active={editorState?.isActiveBold}
                  disabled={!editorState?.canToggleBold}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  title="Tučně (Ctrl+B)"
                >
                  <strong>B</strong>
                </ToolbarButton>
              )}

              {toolbar?.includes('italic') && (
                <ToolbarButton
                  active={editorState?.isActiveItalic}
                  disabled={!editorState?.canToggleItalic}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  title="Kurzíva (Ctrl+I)"
                >
                  <em>I</em>
                </ToolbarButton>
              )}

              {toolbar?.includes('link') && (
                <ToolbarButton
                  active={editorState?.isActiveLink}
                  disabled={
                    editorState?.isActiveLink
                      ? !editorState?.canUnsetLink
                      : !editorState?.canSetLink
                  }
                  onClick={handleToggleLink}
                  title={
                    editorState?.isActiveLink ? 'Upravit odkaz' : 'Vložit odkaz'
                  }
                >
                  <LinkIcon />
                </ToolbarButton>
              )}

              {toolbar?.includes('h2') && (
                <ToolbarButton
                  active={editorState?.isActiveH2}
                  disabled={!editorState?.canToggleH2}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  title="Nadpis 2"
                >
                  H2
                </ToolbarButton>
              )}

              {toolbar?.includes('h3') && (
                <ToolbarButton
                  active={editorState?.isActiveH3}
                  disabled={!editorState?.canToggleH3}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  title="Nadpis 3"
                >
                  H3
                </ToolbarButton>
              )}

              {toolbar?.includes('bulletList') && (
                <ToolbarButton
                  active={editorState?.isActiveBulletList}
                  disabled={!editorState?.canToggleBulletList}
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  title="Odrážkový seznam"
                >
                  •&nbsp;List
                </ToolbarButton>
              )}

              {toolbar?.includes('orderedList') && (
                <ToolbarButton
                  active={editorState?.isActiveOrderedList}
                  disabled={!editorState?.canToggleOrderedList}
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  title="Číslovaný seznam"
                >
                  1.&nbsp;List
                </ToolbarButton>
              )}

              {toolbar?.includes('blockquote') && (
                <ToolbarButton
                  active={editorState?.isActiveBlockquote}
                  disabled={!editorState?.canToggleBlockquote}
                  onClick={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  title="Citace"
                >
                  "&nbsp;"
                </ToolbarButton>
              )}

              {toolbar?.includes('hardBreak') && (
                <ToolbarButton
                  disabled={!editorState?.canSetHardBreak}
                  onClick={() => editor?.chain().focus().setHardBreak().run()}
                  title="Zalomení řádku"
                >
                  ↵
                </ToolbarButton>
              )}

              {toolbar?.includes('undo') && (
                <ToolbarButton
                  disabled={!editorState?.canUndo}
                  onClick={() => editor?.chain().focus().undo().run()}
                  title="Zpět (Ctrl+Z)"
                >
                  <UndoIcon />
                </ToolbarButton>
              )}

              {toolbar?.includes('redo') && (
                <ToolbarButton
                  disabled={!editorState?.canRedo}
                  onClick={() => editor?.chain().focus().redo().run()}
                  title="Znovu (Ctrl+Y)"
                >
                  <RedoIcon />
                </ToolbarButton>
              )}
            </Toolbar>

            <EditorContent editor={editor} />
          </>
        )}

        {/* Hidden input for form submission and focus management */}
        <input
          {...getInputProps(field, { type: 'text' })}
          {...restInputProps}
          aria-hidden="true"
          className={clsx(styles.hiddenInput, inputClassName)}
          onFocus={() => editor?.commands.focus()}
          tabIndex={-1}
        />
      </div>

      <ErrorMessageGroup>
        {field.errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
