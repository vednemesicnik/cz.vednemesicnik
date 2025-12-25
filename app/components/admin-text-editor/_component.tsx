import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { useEffect, useRef } from 'react'
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

type Props = Omit<ComponentProps<'input'>, 'onChange' | 'value'> & {
  label: string
  errors?: string[]
  defaultValue?: string // JSON string
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

  const inputRef = useRef<HTMLInputElement>(null)

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
      inputRef.current?.setAttribute('value', newValue)
    },
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
                active={editor.isActive('bold')}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Tučně (Ctrl+B)"
              >
                <strong>B</strong>
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive('italic')}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Kurzíva (Ctrl+I)"
              >
                <em>I</em>
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive('heading', { level: 1 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                title="Nadpis 1"
              >
                H1
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive('heading', { level: 2 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                title="Nadpis 2"
              >
                H2
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive('heading', { level: 3 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                title="Nadpis 3"
              >
                H3
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive('bulletList')}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Odrážkový seznam"
              >
                •&nbsp;List
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive('orderedList')}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Číslovaný seznam"
              >
                1.&nbsp;List
              </ToolbarButton>

              <ToolbarButton
                active={editor.isActive('blockquote')}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                title="Citace"
              >
                "&nbsp;"
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().setHardBreak().run()}
                title="Zalomení řádku"
              >
                ↵
              </ToolbarButton>

              <ToolbarButton
                disabled={!editor.can().chain().focus().undo().run()}
                onClick={() => editor.chain().focus().undo().run()}
                title="Zpět (Ctrl+Z)"
              >
                <UndoIcon />
              </ToolbarButton>

              <ToolbarButton
                disabled={!editor.can().chain().focus().redo().run()}
                onClick={() => editor.chain().focus().redo().run()}
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
          id={id}
          name={name}
          onFocus={() => {
            if (editor) {
              editor.commands.focus()
            }
          }}
          ref={inputRef}
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
