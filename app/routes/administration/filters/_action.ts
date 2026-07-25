import { parseWithZod } from '@conform-to/zod/v4'
import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, data } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { validateFilterQuery } from '~/utils/admin-list-filters'
import { requireSession } from '~/utils/auth.server'
import { validateCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'

import { schema } from './_schema'
import {
  createFilter,
  deleteFilter,
  getOwnedFilter,
  overwriteFilter,
  renameFilter,
  setDefaultFilter,
  setSharedFilter,
  unsetDefaultFilter,
} from './utils/filter-mutations.server'

const INTENT_VALUE = FORM_CONFIG.intent.value

const DUPLICATE_NAME_ERROR = 'Filtr s tímto názvem už existuje.'
const EMPTY_QUERY_ERROR = 'Filtr neobsahuje žádné platné parametry.'
const LIMIT_REACHED_ERROR = 'Dosáhli jste maximálního počtu uložených filtrů.'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, { async: true, schema })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  // A POST to a resource route runs only this action — the authenticated layout's
  // loader does not guard it, so the session has to be required here.
  const { userId } = await requireSession(request)

  const payload = submission.value

  const replyWithFieldError = (field: 'name' | 'query', message: string) =>
    data(
      {
        submissionResult: submission.reply({
          fieldErrors: { [field]: [message] },
        }),
      },
      { status: 400 },
    )

  if (payload.intent === INTENT_VALUE.createFilter) {
    // Validated before the transaction opens, so an unusable snapshot cannot
    // unset the existing default on its way to failing.
    const query = validateFilterQuery(payload.query, payload.tableKey)

    if (query === null) {
      return replyWithFieldError('query', EMPTY_QUERY_ERROR)
    }

    const result = await createFilter({
      isDefault: payload.isDefault === true,
      isShared: payload.isShared === true,
      name: payload.name,
      query,
      tableKey: payload.tableKey,
      userId,
    })

    if (result.status === 'duplicate-name') {
      return replyWithFieldError('name', DUPLICATE_NAME_ERROR)
    }

    if (result.status === 'limit-reached') {
      return replyWithFieldError('name', LIMIT_REACHED_ERROR)
    }

    return data({
      filterId: result.filterId,
      submissionResult: submission.reply(),
    })
  }

  // Every remaining intent addresses an existing row; one user-scoped read serves
  // both the ownership guard and the fields the mutations need.
  const filter = await getOwnedFilter({ filterId: payload.id, userId })

  invariantResponse(filter !== null, 'Nemáte oprávnění k této akci.', {
    status: 403,
  })

  switch (payload.intent) {
    case INTENT_VALUE.renameFilter: {
      const result = await renameFilter({
        filterId: filter.id,
        name: payload.name,
      })

      if (result.status === 'duplicate-name') {
        return replyWithFieldError('name', DUPLICATE_NAME_ERROR)
      }

      break
    }

    case INTENT_VALUE.overwriteFilter: {
      // The table comes from the stored row: a forged `tableKey` must not be able
      // to park an articles query on a users preset.
      const query = validateFilterQuery(payload.query, filter.tableKey)

      if (query === null) {
        return replyWithFieldError('query', EMPTY_QUERY_ERROR)
      }

      await overwriteFilter({ filterId: filter.id, query })
      break
    }

    case INTENT_VALUE.deleteFilter:
      await deleteFilter({ filterId: filter.id })
      break

    case INTENT_VALUE.setDefaultFilter:
      await setDefaultFilter({
        filterId: filter.id,
        tableKey: filter.tableKey,
        userId,
      })
      break

    case INTENT_VALUE.unsetDefaultFilter:
      await unsetDefaultFilter({ filterId: filter.id })
      break

    case INTENT_VALUE.toggleSharedFilter:
      await setSharedFilter({ filterId: filter.id, isShared: !filter.isShared })
      break
  }

  return data({ submissionResult: submission.reply() })
}
