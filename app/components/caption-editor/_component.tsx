import type { FieldMetadata } from '@conform-to/react'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'
import { TextEditorContent } from '~/components/text-editor-content'
import { TextEditorHiddenInput } from '~/components/text-editor-hidden-input'
import { TextEditorLinkButton } from '~/components/text-editor-link-button'
import { useTextEditor } from '~/hooks/use-text-editor'
import styles from './_styles.module.css'

type Props = {
  label: string
  className?: string
  inputProps?: ComponentProps<'input'>
  field: FieldMetadata<string | undefined>
  /** Only reads, for good: grey, without the link tool (design 24h). */
  readOnly?: boolean
}

/**
 * An image's caption (design 24b, `.vdm-imagetile__caption`): a short field
 * set like the image tile's alt text, with the link tool as a chip at its end
 * instead of a toolbar. The text of an article is `TextEditor`.
 *
 * @param props.field - The Conform field; the editor writes its JSON into it.
 */
export const CaptionEditor = ({
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
}: Props) => {
  const hasErrors = field.errors !== undefined && field.errors.length > 0
  const { editor, labelId } = useTextEditor({
    disabled: isInputDisabled || readOnly,
    field,
    placeholder: inputPlaceholder,
  })

  return (
    <section className={clsx(styles.captionEditor, className)}>
      <Label
        className={styles.label}
        htmlFor={field.id}
        id={labelId}
        required={field.required}
      >
        {label}
      </Label>

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
    </section>
  )
}
