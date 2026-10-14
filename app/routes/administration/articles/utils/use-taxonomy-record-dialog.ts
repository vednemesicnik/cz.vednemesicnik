import { type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { useFetcher, useLocation, useNavigate } from 'react-router'

import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { isNameTaken } from '~/utils/is-name-taken'
import { recentChangeTints } from '~/utils/recent-change-tints'
import { slugify } from '~/utils/slugify'
import { useModalDialog } from '~/utils/use-modal-dialog'
import { DIALOG_OPENER_STATE } from './dialog-opener-state'
import type { TaxonomyRecordCopy } from './taxonomy-record-copy'
import { taxonomyRecordSchema } from './taxonomy-record-schema'

const INTENT_VALUE = FORM_CONFIG.intent.value

type ActionData =
  | {
      submissionResult: SubmissionResult<string[]>
      slugSuggestion?: string | null
    }
  | { status: 'success'; id: string; intent: string | null }

type Options = {
  copy: TaxonomyRecordCopy
  defaultValue: { authorId: string; name: string; slug: string }
  formId: string
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
 * Saves a category or tag from its dialog (design 25c, 30c): the form, sent
 * through a fetcher so the dialog stays open on an error; on success a toast,
 * the row's tint and closing. Closing goes back to the page that opened the
 * dialog, or to its parent when nothing in the app did (a shared link).
 *
 * @param options.parentPath - The dialog's parent with its query.
 * @returns The dialog's ref, the fetcher, the Conform form and fields, the
 *   free address the server suggests for a taken one, and `close`.
 */
export const useTaxonomyRecordDialog = ({
  copy,
  defaultValue,
  formId,
  parentPath,
}: Options) => {
  const navigate = useNavigate()
  const location = useLocation()
  const showToast = useToast()
  const fetcher = useFetcher<ActionData>()

  const isOpenedInApp =
    location.state?.opensDialog === DIALOG_OPENER_STATE.opensDialog
  const ref = useModalDialog(
    () =>
      isOpenedInApp
        ? navigate(-1)
        : navigate(parentPath, { preventScrollReset: true, replace: true }),
    { shouldStayOpen: () => fetcher.state !== 'idle' },
  )

  const lastResult =
    fetcher.data !== undefined && 'submissionResult' in fetcher.data
      ? fetcher.data.submissionResult
      : undefined

  // Validating in the browser would clear the server's answer at the next
  // blur or „Použít …“: a taken name or address stays an error until changed.
  // The button's intent is checked on the server only.
  const takenName = getRejectedValue(lastResult, 'name', copy.takenName)
  const takenSlug = getRejectedValue(lastResult, 'slug', copy.takenSlug)
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
    id: formId,
    lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
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

  return {
    close: () => ref.current?.close(),
    fetcher,
    fields,
    form,
    isSubmitting: fetcher.state !== 'idle',
    ref,
    slugSuggestion,
  }
}
