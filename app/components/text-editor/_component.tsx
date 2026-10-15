import { type FieldMetadata, getInputProps, useField } from '@conform-to/react'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { useEffect } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { LinkIcon } from '~/components/icons/link-icon'
import { ListIcon } from '~/components/icons/list-icon'
import { ListOrderedIcon } from '~/components/icons/list-ordered-icon'
import { QuoteIcon } from '~/components/icons/quote-icon'
import { RedoIcon } from '~/components/icons/redo-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { Label } from '~/components/label'
import { TextEditorToolbar } from '~/components/text-editor-toolbar'
import { TextEditorToolbarButton } from '~/components/text-editor-toolbar-button'
import { TextEditorToolbarGroup } from '~/components/text-editor-toolbar-group'
import { createEditorContent } from '~/utils/create-editor-content'
import styles from './_styles.module.css'
import './_styles.css'

type ToolOption =
  | 'bold'
  | 'italic'
  | 'link'
  | 'h2'
  | 'h3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'undo'
  | 'redo'

type Props = {
  label: string
  className?: string
  inputProps?: ComponentProps<'input'>
  field: FieldMetadata<string | undefined>
  toolbar?: ToolOption[]
  /** Only reads, for good: grey, without the toolbar (design 24h). */
  readOnly?: boolean
}

/**
 * The text of an article as the web sets it, with its toolbar on top (design
 * 24a, jb81di02): **B**, *I* and the link, *Nadpis* and *Podnadpis* in words,
 * the lists and the quote, undo and redo at the end. Shift+Enter breaks a
 * line. The field grows with the text, and the toolbar stays at its top while
 * it scrolls.
 *
 * @param props.field - The Conform field; the editor writes its JSON into it.
 * @param props.toolbar - The tools shown, all by default.
 */
export const TextEditor = ({
  label,
  field,
  inputProps: {
    className: inputClassName,
    placeholder: inputPlaceholder,
    disabled: isInputDisabled = false,
    ...restInputProps
  } = {},
  className,
  readOnly = false,
  toolbar = [
    'bold',
    'italic',
    'link',
    'h2',
    'h3',
    'bulletList',
    'orderedList',
    'blockquote',
    'undo',
    'redo',
  ],
}: Props) => {
  const inputDisabled = isInputDisabled || readOnly
  const [_meta, form] = useField(field.name)
  const hasErrors = field.errors !== undefined && field.errors.length > 0
  const labelId = `${field.id}-label`

  const editor = useEditor({
    content: createEditorContent(field.defaultValue),
    editable: !inputDisabled,
    // The text field is named by its label.
    editorProps: {
      attributes: {
        'aria-labelledby': labelId,
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
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

  const hasFormatGroup =
    toolbar.includes('bold') ||
    toolbar.includes('italic') ||
    toolbar.includes('link')
  const hasHeadingGroup = toolbar.includes('h2') || toolbar.includes('h3')
  const hasBlockGroup =
    toolbar.includes('bulletList') ||
    toolbar.includes('orderedList') ||
    toolbar.includes('blockquote')
  const hasHistoryGroup = toolbar.includes('undo') || toolbar.includes('redo')

  return (
    <section className={clsx(styles.container, className)}>
      <Label htmlFor={field.id} id={labelId} required={field.required}>
        {label}
      </Label>

      <div
        className={clsx(
          styles.editorWrapper,
          hasErrors && styles.editorError,
          readOnly && styles.editorReadOnly,
        )}
      >
        {editor && (
          <>
            {/* A read-only editor has no toolbar (design 24h). */}
            {!readOnly && (
              <TextEditorToolbar label={`Formát: ${label}`}>
                {hasFormatGroup && (
                  <TextEditorToolbarGroup>
                    {toolbar.includes('bold') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveBold}
                        disabled={!editorState?.canToggleBold}
                        label={'Tučné'}
                        onClick={() =>
                          editor?.chain().focus().toggleBold().run()
                        }
                        shortcut={'Ctrl+B'}
                      >
                        <strong>B</strong>
                      </TextEditorToolbarButton>
                    )}

                    {toolbar.includes('italic') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveItalic}
                        disabled={!editorState?.canToggleItalic}
                        label={'Kurzíva'}
                        onClick={() =>
                          editor?.chain().focus().toggleItalic().run()
                        }
                        shortcut={'Ctrl+I'}
                      >
                        <em>I</em>
                      </TextEditorToolbarButton>
                    )}

                    {toolbar.includes('link') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveLink}
                        disabled={
                          editorState?.isActiveLink
                            ? !editorState?.canUnsetLink
                            : !editorState?.canSetLink
                        }
                        label={'Odkaz'}
                        onClick={handleToggleLink}
                      >
                        <LinkIcon />
                      </TextEditorToolbarButton>
                    )}
                  </TextEditorToolbarGroup>
                )}

                {/* In words: two heading icons would not tell apart. */}
                {hasHeadingGroup && (
                  <TextEditorToolbarGroup>
                    {toolbar.includes('h2') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveH2}
                        disabled={!editorState?.canToggleH2}
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run()
                        }
                      >
                        Nadpis
                      </TextEditorToolbarButton>
                    )}

                    {toolbar.includes('h3') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveH3}
                        disabled={!editorState?.canToggleH3}
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 3 })
                            .run()
                        }
                      >
                        Podnadpis
                      </TextEditorToolbarButton>
                    )}
                  </TextEditorToolbarGroup>
                )}

                {hasBlockGroup && (
                  <TextEditorToolbarGroup>
                    {toolbar.includes('bulletList') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveBulletList}
                        disabled={!editorState?.canToggleBulletList}
                        label={'Seznam'}
                        onClick={() =>
                          editor?.chain().focus().toggleBulletList().run()
                        }
                      >
                        <ListIcon />
                      </TextEditorToolbarButton>
                    )}

                    {toolbar.includes('orderedList') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveOrderedList}
                        disabled={!editorState?.canToggleOrderedList}
                        label={'Číslovaný seznam'}
                        onClick={() =>
                          editor?.chain().focus().toggleOrderedList().run()
                        }
                      >
                        <ListOrderedIcon />
                      </TextEditorToolbarButton>
                    )}

                    {toolbar.includes('blockquote') && (
                      <TextEditorToolbarButton
                        active={editorState?.isActiveBlockquote}
                        disabled={!editorState?.canToggleBlockquote}
                        label={'Citace'}
                        onClick={() =>
                          editor?.chain().focus().toggleBlockquote().run()
                        }
                      >
                        <QuoteIcon />
                      </TextEditorToolbarButton>
                    )}
                  </TextEditorToolbarGroup>
                )}

                {hasHistoryGroup && (
                  <TextEditorToolbarGroup isAtEnd>
                    {toolbar.includes('undo') && (
                      <TextEditorToolbarButton
                        disabled={!editorState?.canUndo}
                        label={'Zpět'}
                        onClick={() => editor?.chain().focus().undo().run()}
                        shortcut={'Ctrl+Z'}
                      >
                        <UndoIcon />
                      </TextEditorToolbarButton>
                    )}

                    {toolbar.includes('redo') && (
                      <TextEditorToolbarButton
                        disabled={!editorState?.canRedo}
                        label={'Znovu'}
                        onClick={() => editor?.chain().focus().redo().run()}
                        shortcut={'Ctrl+Y'}
                      >
                        <RedoIcon />
                      </TextEditorToolbarButton>
                    )}
                  </TextEditorToolbarGroup>
                )}
              </TextEditorToolbar>
            )}

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
