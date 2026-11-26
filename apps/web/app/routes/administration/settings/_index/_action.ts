import { parseWithZod } from '@conform-to/zod/v4'
import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, data } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { requireAuthentication } from '~/utils/auth.server'
import { checkCSRF, requireCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { publishAccountEvent } from '~/utils/sse/publish-account-event.server'
import { throwDbError } from '~/utils/throw-db-error.server'

import { colorSchemeSchema, profileSchema } from './_schema'
import { updateOwnProfile } from './utils/update-own-profile.server'

export const action = async ({ request, url }: ActionFunctionArgs) => {
  // Whose profile or sessions change comes from the signed-in session, never
  // from the form: a posted id would let anyone change another account.
  const { sessionId, userId } = await requireAuthentication({ request, url })

  const formData = await request.formData()

  const intent = formData.get(FORM_CONFIG.intent.name)

  // The profile form stays on screen and shows the token message; the other
  // intents are one-click actions (design 30h).
  if (intent === FORM_CONFIG.intent.value.updateProfile) {
    const csrfFailure = await checkCSRF(formData, request)
    if (csrfFailure !== null) return csrfFailure
  } else {
    await requireCSRF(formData, request)
  }

  if (intent === FORM_CONFIG.intent.value.delete) {
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

    return { status: 'other-sign-ins-ended' as const }
  }

  // „Už nezobrazovat“ closes the welcome row for good (design 29e).
  if (intent === FORM_CONFIG.intent.value.dismissWelcome) {
    try {
      await prisma.user.update({
        data: { welcomeDismissedAt: new Date() },
        where: { id: userId },
      })
    } catch (error) {
      throwDbError(error, 'Unable to close the welcome row.')
    }

    return { status: 'welcome-dismissed' as const }
  }

  // The colour scheme belongs to the signed-in account (design 29a, #560).
  if (intent === FORM_CONFIG.intent.value.updateColorScheme) {
    const result = colorSchemeSchema.safeParse(Object.fromEntries(formData))

    if (!result.success) {
      return data({ status: 'color-scheme-invalid' as const }, { status: 400 })
    }

    try {
      await prisma.user.update({
        data: { colorScheme: result.data.colorScheme },
        where: { id: userId },
      })
    } catch (error) {
      throwDbError(error, "Unable to update the user's colour scheme.")
    }

    return { status: 'color-scheme-updated' as const }
  }

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['author'],
  })

  checkUserPermission(context, {
    action: 'update',
    entity: 'author',
    targetUserId: userId,
  })

  invariantResponse(
    intent === FORM_CONFIG.intent.value.updateProfile,
    'Invalid intent',
  )

  const submission = parseWithZod(formData, { schema: profileSchema })

  if (submission.status !== 'success') {
    return data(
      { status: 'error' as const, submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  await updateOwnProfile({ authorId: context.authorId, ...submission.value })

  publishAccountEvent({
    change: 'update',
    entity: 'author',
    entityId: context.authorId,
  })

  return { status: 'profile-saved' as const }
}
