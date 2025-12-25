import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { useEffect } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'
import styles from './_styles.module.css'
import { Toolbar } from './components/toolbar'
import { ToolbarButton } from './components/toolbar-button'

type Props = ComponentProps<'input'> & {
  label: string
  errors?: string[]
  defaultValue?: string // JSON string or empty
  placeholder?: string
}

export const AdminTextEditor = ({
  label,
  errors,
  id,
  name,
  required,
  defaultValue,
  placeholder = 'Začněte psát...',
  type = 'hidden',
  ...rest
}: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0

  const editor = useEditor({
    content: defaultValue ? JSON.parse(defaultValue) : '',
    editorProps: {
      attributes: {
        class: clsx(styles.editor, hasErrors && styles.editorError),
      },
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    immediatelyRender: false,
  })

  // Sync editor content with hidden input
  useEffect(() => {
    if (!editor) return

    const hiddenInput = document.querySelector<HTMLInputElement>(
      `input[name="${name}"]`,
    )
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(editor.getJSON())
    }
  }, [editor?.state.doc, editor, name])

  return (
    <section className={styles.container}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      <div className={styles.editorWrapper}>
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
                ↶
              </ToolbarButton>

              <ToolbarButton
                disabled={!editor.can().chain().focus().redo().run()}
                onClick={() => editor.chain().focus().redo().run()}
                title="Znovu (Ctrl+Y)"
              >
                ↷
              </ToolbarButton>
            </Toolbar>

            <EditorContent editor={editor} />
          </>
        )}
      </div>

      {/* Hidden input for form submission */}
      <input id={id} name={name} required={required} type={type} {...rest} />

      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
