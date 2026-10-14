import {
  getFormProps,
  getInputProps,
  getSelectProps,
  type SubmissionResult,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef, useState } from 'react'
import { useFetcher, useNavigate } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Select } from '~/components/select'
import { TextField } from '~/components/text-field'
import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { isNameTaken } from '~/utils/is-name-taken'
import { recentChangeTints } from '~/utils/recent-change-tints'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'
import { useModalDialog } from '~/utils/use-modal-dialog'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { taxonomyRecordSchema } from '../../utils/taxonomy-record-schema'
import styles from './_styles.module.css'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

type ActionData =
  | {
      submissionResult: SubmissionResult<string[]>
      slugSuggestion?: string | null
    }
  | { status: 'success'; id: string; intent: string | null }

type Author = {
  id: string
  name: string
}

type Mode =
  | {
      mode: 'new'
      primaryIntent:
        | typeof INTENT_VALUE.publish
        | typeof INTENT_VALUE.submitForReview
    }
  | {
      mode: 'edit'
      publishedSlug: string | null
    }

type Props = Mode & {
  copy: TaxonomyRecordCopy
  defaultValue: { authorId: string; name: string; slug: string }
  authors: Author[] | null
  parentPath: string
}

// The value the server refused with the given error, as the form sent it.
const getRejectedValue = (
  result: SubmissionResult<string[]> | undefined,
  field: 'name' | 'slug',
  error: string,
) => {
  const value = result?.initialValue?.[field]

  return result?.error?.[field]?.includes(error) === true &&
    typeof value === 'string'
    ? value
    : null
}

const getToast = (copy: TaxonomyRecordCopy, intent: string | null) => {
  switch (intent) {
    case INTENT_VALUE.saveDraft:
      return copy.toasts.created
    case INTENT_VALUE.publish:
      return copy.toasts.published
    case INTENT_VALUE.submitForReview:
      return copy.toasts.submitted
    default:
      return copy.toasts.saved
  }
}

/**
 * Adds or edits a category or tag in a dialog over its parent (design 25c,
 * 25e, 30a): the list for a new record, the detail for an edit. Saving keeps
 * the person on the parent with a toast, and tints the row of a new record
 * (30c). Closing, saved or not, goes back to the parent.
 *
 * @param props.mode - `new` with the role's primary action (07c), or `edit`
 *   with `publishedSlug`, the address of a draft published before, which
 *   changes with a new one.
 * @param props.authors - The authors to pick from, for the Coordinator only;
 *   `null` hides the field and the server sets the author.
 * @param props.parentPath - Where closing the dialog goes, with its query.
 */
export const TaxonomyRecordDialog = (props: Props) => {
  const { copy, defaultValue, authors, parentPath } = props
  const navigate = useNavigate()
  const showToast = useToast()
  const fetcher = useFetcher<ActionData>()
  const isSubmitting = fetcher.state !== 'idle'

  // Back to the parent, in place of the dialog's own entry, so Back doesn't
  // open it again.
  const ref = useModalDialog(
    () => navigate(parentPath, { preventScrollReset: true, replace: true }),
    { shouldStayOpen: () => fetcher.state !== 'idle' },
  )

  const lastResult =
    fetcher.data !== undefined && 'submissionResult' in fetcher.data
      ? fetcher.data.submissionResult
      : undefined

  // Validating in the browser would clear the server's answer at the next
  // blur or „Použít …“: a taken name or address stays an error until changed.
  const takenName = getRejectedValue(lastResult, 'name', copy.takenName)
  const takenSlug = getRejectedValue(lastResult, 'slug', copy.takenSlug)
  // The button's intent is checked on the server; the browser checks fields.
  const schema = taxonomyRecordSchema.extend({
    name: taxonomyRecordSchema.shape.name.refine(
      (name) => takenName === null || !isNameTaken(name, [takenName]),
      copy.takenName,
    ),
    slug: taxonomyRecordSchema.shape.slug.refine(
      (slug) => takenSlug === null || slug !== slugify(takenSlug),
      copy.takenSlug,
    ),
  })

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue,
    id: `taxonomy-record-${props.mode}`,
    lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  // The address follows the name until the author types in it (25c).
  const [name, setName] = useState(defaultValue.name)
  const autoSlug = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: props.mode === 'new' ? name : undefined,
    updateFieldValue: form.update,
  })

  const handledDataRef = useRef(fetcher.data)

  useEffect(() => {
    const result = fetcher.data

    if (
      fetcher.state !== 'idle' ||
      result === undefined ||
      result === handledDataRef.current ||
      !('status' in result)
    ) {
      return
    }
    handledDataRef.current = result

    recentChangeTints.mark(result.id)
    showToast(getToast(copy, result.intent))
    ref.current?.close()
  }, [copy, fetcher.data, fetcher.state, ref, showToast])

  const slugSuggestion =
    fetcher.data !== undefined && 'slugSuggestion' in fetcher.data
      ? (fetcher.data.slugSuggestion ?? null)
      : null
  const slug = slugify(fields.slug.value ?? '')
  const canUseSuggestion =
    slugSuggestion !== null &&
    fields.slug.errors !== undefined &&
    slug !== slugSuggestion

  const publishedSlug = props.mode === 'edit' ? props.publishedSlug : null
  const isSlugChanged = publishedSlug !== null && slug !== publishedSlug

  const handleCancel = () => ref.current?.close()

  return (
    <AdminDialog
      aria-label={props.mode === 'new' ? copy.newTitle : copy.editTitle}
      ref={ref}
    >
      <AdminModalContent>
        <AdminModalTitle>
          {props.mode === 'new' ? copy.newTitle : copy.editTitle}
        </AdminModalTitle>

        <fetcher.Form
          className={styles.form}
          method={'post'}
          {...getFormProps(form)}
        >
          <AuthenticityTokenInput />

          {form.errors !== undefined && form.errors.length > 0 && (
            <ErrorMessageGroup>
              {form.errors.map((error) => (
                <ErrorMessage key={error}>{error}</ErrorMessage>
              ))}
            </ErrorMessageGroup>
          )}

          <TextField
            label={'Název'}
            onChange={(event) => setName(event.target.value)}
            {...getInputProps(fields.name, { type: 'text' })}
            errors={fields.name.errors}
          />

          <div className={styles.slugField}>
            <TextField
              label={'Adresa'}
              onBlur={autoSlug.handleBlur}
              onFocus={autoSlug.handleFocus}
              onInput={autoSlug.handleInput}
              {...getInputProps(fields.slug, { type: 'text' })}
              errors={fields.slug.errors}
              hint={
                isSlugChanged ? (
                  <>
                    {copy.republishHint}
                    <span className={styles.originalAddress}>
                      Původní adresa: {copy.publicPath}/{publishedSlug}
                    </span>
                  </>
                ) : (
                  `${copy.publicPath}/${slug}`
                )
              }
            />
            {canUseSuggestion && (
              <Button
                onClick={() => {
                  // A chosen address no longer follows the name.
                  autoSlug.handleInput()
                  form.update({ name: fields.slug.name, value: slugSuggestion })
                }}
                size={'sm'}
                type={'button'}
                variant={'outline'}
              >
                Použít {slugSuggestion}
              </Button>
            )}
          </div>

          {authors !== null && (
            <Select
              label={'Autor'}
              {...getSelectProps(fields.authorId)}
              errors={fields.authorId.errors}
            >
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </Select>
          )}

          <AdminModalActions>
            <Button
              disabled={isSubmitting}
              onClick={handleCancel}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            {props.mode === 'new' ? (
              <>
                <Button
                  disabled={isSubmitting}
                  name={INTENT_NAME}
                  size={'sm'}
                  type={'submit'}
                  value={INTENT_VALUE.saveDraft}
                  variant={'outline'}
                >
                  Uložit koncept
                </Button>
                <Button
                  disabled={isSubmitting}
                  name={INTENT_NAME}
                  size={'sm'}
                  type={'submit'}
                  value={props.primaryIntent}
                >
                  {props.primaryIntent === INTENT_VALUE.publish
                    ? 'Publikovat'
                    : 'Odeslat ke schválení'}
                </Button>
              </>
            ) : (
              <Button disabled={isSubmitting} size={'sm'} type={'submit'}>
                Uložit
              </Button>
            )}
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
