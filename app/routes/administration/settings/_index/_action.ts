import { invariantResponse } from '@epic-web/invariant'
import type { ActionFunctionArgs } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { requireAuthentication } from '~/utils/auth.server'
import { requireCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

export const action = async ({ request, url }: ActionFunctionArgs) => {
  // Whose sessions end comes from the signed-in session, never from the form:
  // a posted user id would let anyone sign another account out everywhere.
  const { sessionId, userId } = await requireAuthentication({ request, url })

  const formData = await request.formData()
  await requireCSRF(formData, request)

  const intent = formData.get(FORM_CONFIG.intent.name)
  invariantResponse(
    intent === FORM_CONFIG.intent.value.delete,
    'Invalid intent',
  )

  try {
    await prisma.session.deleteMany({
      where: {
        id: {
          not: sessionId,
        },
        userId,
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to delete the user's sessions.")
  }

  return { status: 'success' }
}
