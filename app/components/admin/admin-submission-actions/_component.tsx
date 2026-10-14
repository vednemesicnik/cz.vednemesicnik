import { useFetcher } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

type Props = {
  contentId: string
  canSubmit: boolean
  canWithdraw: boolean
  canReturn: boolean
}

/**
 * The submission buttons of a content detail (design 07d): Odeslat ke schválení
 * and Vzít zpět do konceptu for its author, Vrátit k úpravám for the Coordinator.
 * They post to the page's action on their own fetcher and confirm with a toast.
 *
 * @param props.contentId - The content the page shows; keys the fetcher.
 */
export const AdminSubmissionActions = ({
  contentId,
  canSubmit,
  canWithdraw,
  canReturn,
}: Props) => {
  const fetcher = useFetcher<{ intent: string; missing: string[] }>({
    key: `submission-${contentId}`,
  })
  const { Form } = fetcher

  useContentActionResult(fetcher.data)

  const isSubmitting = fetcher.state !== 'idle'
  const submittingIntent = isSubmitting
    ? fetcher.formData?.get(INTENT_NAME)
    : null

  return (
    <>
      {canSubmit && (
        <Form method="post">
          <AuthenticityTokenInput />
          <AdminActionButton
            action={'review'}
            disabled={isSubmitting}
            name={INTENT_NAME}
            type={'submit'}
            value={INTENT_VALUE.submitForReview}
          >
            <ArrowUpwardIcon />
            {submittingIntent === INTENT_VALUE.submitForReview
              ? 'Odesílá se...'
              : 'Odeslat ke schválení'}
          </AdminActionButton>
        </Form>
      )}
      {canWithdraw && (
        <Form method="post">
          <AuthenticityTokenInput />
          <AdminActionButton
            action={'retract'}
            disabled={isSubmitting}
            name={INTENT_NAME}
            type={'submit'}
            value={INTENT_VALUE.withdrawSubmission}
          >
            <UndoIcon />
            Vzít zpět do konceptu
          </AdminActionButton>
        </Form>
      )}
      {canReturn && (
        <Form method="post">
          <AuthenticityTokenInput />
          <AdminActionButton
            action={'retract'}
            disabled={isSubmitting}
            name={INTENT_NAME}
            type={'submit'}
            value={INTENT_VALUE.returnForEdits}
          >
            <UndoIcon />
            Vrátit k úpravám
          </AdminActionButton>
        </Form>
      )}
    </>
  )
}
