import type { FieldMetadata } from '@conform-to/react'
import { useEditorState } from '@tiptap/react'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { ListIcon } from '~/components/icons/list-icon'
import { ListOrderedIcon } from '~/components/icons/list-ordered-icon'
import { QuoteIcon } from '~/components/icons/quote-icon'
import { RedoIcon } from '~/components/icons/redo-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { Label } from '~/components/label'
import { TextEditorContent } from '~/components/text-editor-content'
import { TextEditorHiddenInput } from '~/components/text-editor-hidden-input'
import { TextEditorLinkButton } from '~/components/text-editor-link-button'
import { TextEditorToolbar } from '~/components/text-editor-toolbar'
import { TextEditorToolbarButton } from '~/components/text-editor-toolbar-button'
import { TextEditorToolbarGroup } from '~/components/text-editor-toolbar-group'
import { useTextEditor } from '~/hooks/use-text-editor'
import styles from './_styles.module.css'

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
 * it scrolls. An image's caption is `CaptionEditor`.
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
  const hasErrors = field.errors !== undefined && field.errors.length > 0
  const { editor, labelId } = useTextEditor({
    disabled: inputDisabled,
    field,
    placeholder: inputPlaceholder,
  })

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canRedo: editor?.can().redo() ?? false,
      canToggleBlockquote: editor?.can().toggleBlockquote() ?? false,
      canToggleBold: editor?.can().toggleBold() ?? false,
      canToggleBulletList: editor?.can().toggleBulletList() ?? false,
      canToggleH2: editor?.can().toggleHeading({ level: 2 }) ?? false,
      canToggleH3: editor?.can().toggleHeading({ level: 3 }) ?? false,
      canToggleItalic: editor?.can().toggleItalic() ?? false,
      canToggleOrderedList: editor?.can().toggleOrderedList() ?? false,
      canUndo: editor?.can().undo() ?? false,
      isActiveBlockquote: editor?.isActive('blockquote') ?? false,
      isActiveBold: editor?.isActive('bold') ?? false,
      isActiveBulletList: editor?.isActive('bulletList') ?? false,
      isActiveH2: editor?.isActive('heading', { level: 2 }) ?? false,
      isActiveH3: editor?.isActive('heading', { level: 3 }) ?? false,
      isActiveItalic: editor?.isActive('italic') ?? false,
      isActiveOrderedList: editor?.isActive('orderedList') ?? false,
    }),
  })

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
              <TextEditorToolbar>
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
                      <TextEditorLinkButton editor={editor} />
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

            <TextEditorContent editor={editor} />
          </>
        )}

        <TextEditorHiddenInput
          {...restInputProps}
          className={inputClassName}
          editor={editor}
          field={field}
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
