import type { FieldMetadata } from '@conform-to/react'
import { Document } from '@tiptap/extension-document'
import { Link } from '@tiptap/extension-link'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { UndoRedo } from '@tiptap/extensions'
import { clsx } from 'clsx'
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
} from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { TextEditorContent } from '~/components/text-editor-content'
import { TextEditorHiddenInput } from '~/components/text-editor-hidden-input'
import { TextEditorLinkButton } from '~/components/text-editor-link-button'
import { TEXT_EDITOR_LINK_CONFIG } from '~/config/text-editor-link-config'
import { useTextEditor } from '~/hooks/use-text-editor'
import styles from './_styles.module.css'

// Text and links only (design 24b): a typed `17. ` stays text, and a pasted
// heading or list lands as paragraphs.
const formats = [
  Document,
  Paragraph,
  Text,
  Link.configure(TEXT_EDITOR_LINK_CONFIG),
  UndoRedo,
]

type CaptionEditorContextValue = {
  inputId: string
  labelId: string
  required: boolean
}

const Context = createContext<CaptionEditorContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
  className?: string
  inputProps?: ComponentProps<'input'>
  field: FieldMetadata<string | undefined>
  /** Only reads, for good: grey, without the link tool (design 24h). */
  readOnly?: boolean
}

/**
 * An image's caption (design 24b, `.vdm-imagetile__caption`): a short field
 * set like the image tile's alt text, with the link tool as a chip at its end
 * instead of a toolbar. It holds text and links only. The text of an article
 * is `TextEditor`.
 *
 * @example
 * ```tsx
 * <CaptionEditor field={imageFields.description}>
 *   <CaptionEditorLabel>Popisek</CaptionEditorLabel>
 * </CaptionEditor>
 * ```
 *
 * @param props.children - Its `CaptionEditorLabel`, above the field
 * @param props.field - The Conform field; the editor writes its JSON into it.
 */
export const CaptionEditor = ({
  children,
  field,
  inputProps: {
    className: inputClassName,
    placeholder: inputPlaceholder,
    disabled: isInputDisabled = false,
    ...restInputProps
  } = {},
  className,
  readOnly = false,
}: Props) => {
  const hasErrors = field.errors !== undefined && field.errors.length > 0
  const { editor, labelId } = useTextEditor({
    disabled: isInputDisabled || readOnly,
    field,
    formats,
    placeholder: inputPlaceholder,
  })

  return (
    <Context.Provider
      value={{ inputId: field.id, labelId, required: field.required ?? false }}
    >
      <div className={clsx(styles.captionEditor, className)}>
        {children}

        <div
          className={clsx(
            styles.field,
            hasErrors && styles.isInvalid,
            readOnly && styles.isReadOnly,
          )}
        >
          {editor && (
            <>
              <TextEditorContent className={styles.content} editor={editor} />
              {!readOnly && (
                <TextEditorLinkButton
                  className={styles.linkButton}
                  editor={editor}
                />
              )}
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
      </div>
    </Context.Provider>
  )
}

/**
 * What the caption editor shares with its label: the hidden input's id, the
 * label's id (the editor's `aria-labelledby`) and whether the field is
 * required.
 *
 * @returns The caption editor's context
 */
export const useCaptionEditor = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useCaptionEditor must be used within a CaptionEditor')
  }

  return context
}
