import { type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { useFetcher, useNavigate, useNavigation } from 'react-router'

import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'
import {
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'
import { isNameTaken } from '~/utils/is-name-taken'
import { recentChangeTints } from '~/utils/recent-change-tints'
import { slugify } from '~/utils/slugify'
import { useReturnToOpener } from '~/utils/use-return-to-opener'
import { getListPathShowingRecord } from './get-list-path-showing-record'
import type { TaxonomyRecordCopy } from './taxonomy-record-copy'
import { taxonomyRecordSchema } from './taxonomy-record-schema'

const INTENT_VALUE = FORM_CONFIG.intent.value

type ActionData =
  | {
      submissionResult: SubmissionResult<string[]>
      slugSuggestion?: string | null
    }
  | {
      status: 'success'
      id: string
      intent: string | null
      name: string
      slug: string
    }

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
 * Saves a category or tag from its add or edit page (design 25c, 30c): the
 * form, sent through a fetcher so its errors stay at the fields; on success a
 * toast, the row's tint and leaving. Leaving goes back to the page that opened
 * this one, or to the record's parent when nothing in the app did (a shared
 * link).
 *
 * @param options.parentPath - The record's parent with its query.
 * @returns The fetcher, the Conform form and fields, the free address the
 *   server suggests for a taken one, and `handleCancel` for the Zrušit link to
 *   `parentPath`.
 */
export const useTaxonomyRecordForm = ({
  copy,
  defaultValue,
  formId,
  parentPath,
}: Options) => {
  const navigate = useNavigate()
  const navigation = useNavigation()
  const showToast = useToast()
  const fetcher = useFetcher<ActionData>()
  const { handleCancel, leave, returnsToOpener } = useReturnToOpener(parentPath)

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

    // A new row the list's state filter or search would hide opens the list
    // without them (25c). From a shared link the list opens without filters,
    // so a default saved filter does not hide it either.
    if (result.intent !== null) {
      const listPath = getListPathShowingRecord(parentPath, {
        name: result.name,
        slug: result.slug,
        state: result.intent === INTENT_VALUE.publish ? 'published' : 'draft',
      })
      const target =
        !returnsToOpener && !listPath.includes('?')
          ? `${listPath}?${FILTER_PRESET_PARAM}=${FILTER_PRESET_NONE}`
          : listPath

      if (target !== parentPath) {
        navigate(target, { replace: true })
        return
      }
    }

    leave()
  })

  const slugSuggestion =
    fetcher.data !== undefined && 'slugSuggestion' in fetcher.data
      ? (fetcher.data.slugSuggestion ?? null)
      : null

  return {
    fetcher,
    fields,
    form,
    handleCancel,
    // Saved and leaving: the page stays until the parent loads, and a second
    // click must not send the form again.
    isSubmitting:
      fetcher.state !== 'idle' ||
      navigation.state !== 'idle' ||
      (fetcher.data !== undefined && 'status' in fetcher.data),
    slugSuggestion,
  }
}
