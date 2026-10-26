import { useFetcher } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { FORM_CONFIG } from '~/config/form-config'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

type Props = {
  fetcherKey: string
  canSubmit: boolean
  canWithdraw: boolean
  canReturn: boolean
}

/**
 * The submission buttons of a content detail (design 07d): Odeslat ke schválení
 * and Vzít zpět do konceptu for its author, Vrátit k úpravám for the Coordinator.
 * They post to the page's action on the page's fetcher, so the page answers
 * every action's result in one place: a toast, or what blocks it (23h, 27h).
 *
 * @param props.fetcherKey - The key of the page's action fetcher.
 */
export const AdminSubmissionActions = ({
  fetcherKey,
  canSubmit,
  canWithdraw,
  canReturn,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const { Form } = fetcher

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
