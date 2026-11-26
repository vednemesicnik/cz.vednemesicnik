import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

import type { action as issueAction } from '../issue/_index/_action'
import {
  ISSUE_DIRECT_INTENTS,
  type IssueAction,
  type IssueStateAction,
} from './issue-actions'

type Options = {
  issue: {
    id: string
    missingBeforePublish: string[]
  }
  fetcherKey: string
}

/**
 * Runs an issue's actions from its row (design 26a, 26e, 26i, 07c): a state
 * change at once, Publikovat…, Stáhnout z publikace… and Archivovat… through
 * their confirmation, Smazat… through the delete dialog; an incomplete issue
 * says what it lacks instead, and an action the edit hold refused says who
 * edits it.
 *
 * @param options.issue - The issue's id and what publishing it lacks.
 * @param options.fetcherKey - The fetcher the actions and the dialogs share.
 * @returns `runAction`, whether an action is running, and what
 *   `IssueActionDialogs` renders.
 */
export const useIssueActions = ({ issue, fetcherKey }: Options) => {
  const detailHref = href('/administration/archive/:issueId', {
    issueId: issue.id,
  })
  const editHref = href('/administration/archive/:issueId/edit-issue', {
    issueId: issue.id,
  })
  // The issue has no page of its own: the web shows it in the archive (26b).
  const archivePath = href('/archive')

  const fetcher = useFetcher<typeof issueAction>({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()
  // A submit the server finds incomplete lists what is missing (26e); an
  // action the edit hold refused says who edits the issue (26i).
  const { closeMissingList, missingList, showMissingList } =
    useContentActionResult(fetcher.data, { heldSubject: 'číslo' })

  const [stateDialog, setStateDialog] = useState<IssueStateAction | null>(null)

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action: detailHref, key: fetcherKey },
  )

  const runAction = (action: IssueAction) => {
    const intent = ISSUE_DIRECT_INTENTS[action]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(FORM_CONFIG.intent.name, intent)
      void fetcher.submit(formData, { action: detailHref, method: 'POST' })
      return
    }

    switch (action) {
      case 'approve-and-publish':
      case 'publish':
        // An incomplete issue says what it lacks instead (26e).
        if (issue.missingBeforePublish.length > 0) {
          return showMissingList({
            intent: FORM_CONFIG.intent.value.publish,
            items: issue.missingBeforePublish,
          })
        }
        return setStateDialog(action)
      case 'retract':
      case 'archive':
        return setStateDialog(action)
      case 'delete':
        return openDeleteDialog()
      case 'edit':
      case 'take-over':
        return navigate(editHref)
      case 'view-on-web':
        return window.open(archivePath, '_blank', 'noopener')
    }
  }

  return {
    closeMissingList,
    closeStateDialog: () => setStateDialog(null),
    deleteDialogRef,
    detailHref,
    editHref,
    fetcherKey,
    isSubmitting,
    missingList,
    runAction,
    stateDialog,
  }
}
