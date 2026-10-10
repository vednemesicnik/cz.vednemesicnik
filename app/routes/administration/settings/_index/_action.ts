import { parseWithZod } from '@conform-to/zod/v4'
import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, data } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { requireAuthentication } from '~/utils/auth.server'
import { checkCSRF, requireCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { throwDbError } from '~/utils/throw-db-error.server'

import { imageSchema, profileSchema } from './_schema'
import { deleteUserImage } from './utils/delete-user-image.server'
import { replaceUserImage } from './utils/replace-user-image.server'
import { updateOwnProfile } from './utils/update-own-profile.server'

const imageTooLargeMessage = 'Vyberte obrázek do 5 MB — tento je příliš velký.'

// Only the photo upload is multipart; a file over the parser's limit throws,
// which reads to the person as a too-large photo.
const readFormData = async (request: Request) => {
  const contentType = request.headers.get('Content-Type') ?? ''

  if (!contentType.startsWith('multipart/form-data')) {
    return request.formData()
  }

  try {
    return await getMultipartFormData(request)
  } catch {
    return null
  }
}

export const action = async ({ request, url }: ActionFunctionArgs) => {
  // Whose profile or sessions change comes from the signed-in session, never
  // from the form: a posted id would let anyone change another account.
  const { sessionId, userId } = await requireAuthentication({ request, url })

  const formData = await readFormData(request)

  if (formData === null) {
    return data(
      { imageError: imageTooLargeMessage, status: 'error' as const },
      { status: 413 },
    )
  }

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

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['author'],
  })

  checkUserPermission(context, {
    action: 'update',
    entity: 'author',
    targetUserId: userId,
  })

  if (intent === FORM_CONFIG.intent.value.updateProfile) {
    const submission = parseWithZod(formData, { schema: profileSchema })

    if (submission.status !== 'success') {
      return data(
        { status: 'error' as const, submissionResult: submission.reply() },
        { status: getStatusCodeFromSubmissionStatus(submission.status) },
      )
    }

    await updateOwnProfile({ authorId: context.authorId, ...submission.value })

    return { status: 'profile-saved' as const }
  }

  if (intent === FORM_CONFIG.intent.value.uploadImage) {
    const submission = parseWithZod(formData, { schema: imageSchema })

    if (submission.status !== 'success') {
      const [imageError] = submission.error?.image ?? []

      return data(
        {
          imageError:
            imageError ?? 'Vyberte obrázek — tento soubor není obrázek.',
          status: 'error' as const,
        },
        { status: 400 },
      )
    }

    try {
      await replaceUserImage(userId, submission.value.image)
    } catch {
      return data(
        {
          imageError: 'Zkuste fotku nahrát znovu — nahrání se nezdařilo.',
          status: 'error' as const,
        },
        { status: 500 },
      )
    }

    return { status: 'image-saved' as const }
  }

  invariantResponse(
    intent === FORM_CONFIG.intent.value.deleteImage,
    'Invalid intent',
  )

  await deleteUserImage(userId)

  return { status: 'image-deleted' as const }
}
