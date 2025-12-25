import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { useEffect } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { RedoIcon } from '~/components/icons/redo-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { Label } from '~/components/label'
import { createEditorContent } from '~/utils/create-editor-content'
import styles from './_styles.module.css'
import './_styles.css'
import { useField } from '@conform-to/react'
import { Toolbar } from './components/toolbar'
import { ToolbarButton } from './components/toolbar-button'

type Props = Omit<
  ComponentProps<'input'>,
  'onChange' | 'value' | 'defaultValue'
> & {
  defaultValue?: string
  label: string
  errors?: string[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const AdminTextEditor = ({
  label,
  errors,
  id,
  name = '',
  required,
  defaultValue,
  placeholder = 'Začněte psát...',
  className,
  disabled = false,
  ...rest
}: Props) => {
  const [_, form] = useField(name)

  const hasErrors = errors !== undefined && errors.length > 0

  const editor = useEditor({
    content: createEditorContent(defaultValue),
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    immediatelyRender: false,
    onBlur: () => {
      if (form.dirty) {
        form.validate({ name })
      }
    },
    onUpdate: ({ editor }) => {
      const newValue = editor.isEmpty ? '' : JSON.stringify(editor.getJSON())
      form.update({ name, value: newValue })
    },
  })

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canRedo: editor?.can().redo() ?? false,
      canSetHardBreak: editor?.can().setHardBreak() ?? false,
      canToggleBlockquote: editor?.can().toggleBlockquote() ?? false,
      canToggleBold: editor?.can().toggleBold() ?? false,
      canToggleBulletList: editor?.can().toggleBulletList() ?? false,
      canToggleH1: editor?.can().toggleHeading({ level: 1 }) ?? false,
      canToggleH2: editor?.can().toggleHeading({ level: 2 }) ?? false,
      canToggleH3: editor?.can().toggleHeading({ level: 3 }) ?? false,
      canToggleItalic: editor?.can().toggleItalic() ?? false,
      canToggleOrderedList: editor?.can().toggleOrderedList() ?? false,
      canUndo: editor?.can().undo() ?? false,
      isActiveBlockquote: editor?.isActive('blockquote') ?? false,
      isActiveBold: editor?.isActive('bold') ?? false,
      isActiveBulletList: editor?.isActive('bulletList') ?? false,
      isActiveH1: editor?.isActive('heading', { level: 1 }) ?? false,
      isActiveH2: editor?.isActive('heading', { level: 2 }) ?? false,
      isActiveH3: editor?.isActive('heading', { level: 3 }) ?? false,
      isActiveItalic: editor?.isActive('italic') ?? false,
      isActiveOrderedList: editor?.isActive('orderedList') ?? false,
    }),
  })

  // Update editor editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  return (
    <section className={clsx(styles.container, className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      <div
        className={clsx(styles.editorWrapper, hasErrors && styles.editorError)}
      >
        {editor && (
          <>
            <Toolbar>
              <ToolbarButton
                active={editorState?.isActiveBold}
                disabled={!editorState?.canToggleBold}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="Tučně (Ctrl+B)"
              >
                <strong>B</strong>
              </ToolbarButton>

              <ToolbarButton
                active={editorState?.isActiveItalic}
                disabled={!editorState?.canToggleItalic}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="Kurzíva (Ctrl+I)"
              >
                <em>I</em>
              </ToolbarButton>

              <ToolbarButton
                active={editorState?.isActiveH1}
                disabled={!editorState?.canToggleH1}
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                title="Nadpis 1"
              >
                H1
              </ToolbarButton>

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

              <ToolbarButton
                active={editorState?.isActiveBulletList}
                disabled={!editorState?.canToggleBulletList}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                title="Odrážkový seznam"
              >
                •&nbsp;List
              </ToolbarButton>

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

              <ToolbarButton
                active={editorState?.isActiveBlockquote}
                disabled={!editorState?.canToggleBlockquote}
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                title="Citace"
              >
                "&nbsp;"
              </ToolbarButton>

              <ToolbarButton
                disabled={!editorState?.canSetHardBreak}
                onClick={() => editor?.chain().focus().setHardBreak().run()}
                title="Zalomení řádku"
              >
                ↵
              </ToolbarButton>

              <ToolbarButton
                disabled={!editorState?.canUndo}
                onClick={() => editor?.chain().focus().undo().run()}
                title="Zpět (Ctrl+Z)"
              >
                <UndoIcon />
              </ToolbarButton>

              <ToolbarButton
                disabled={!editorState?.canRedo}
                onClick={() => editor?.chain().focus().redo().run()}
                title="Znovu (Ctrl+Y)"
              >
                <RedoIcon />
              </ToolbarButton>
            </Toolbar>

            <EditorContent editor={editor} />
          </>
        )}

        {/* Hidden input for form submission and focus management */}
        <input
          aria-hidden="true"
          className={styles.hiddenInput}
          defaultValue={defaultValue}
          disabled={disabled}
          id={id}
          name={name}
          onFocus={() => editor?.commands.focus()}
          required={required}
          tabIndex={-1}
          {...rest}
        />
      </div>

      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
