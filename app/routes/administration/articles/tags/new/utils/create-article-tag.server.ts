import { data } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'
import { canChooseRecordAuthor } from '../../../utils/can-choose-record-author'
import { getNewRecordPrimaryIntent } from '../../../utils/get-new-record-primary-intent'
import type { TaxonomyConflicts } from '../../../utils/get-taxonomy-conflicts'
import { findTagConflicts } from '../../utils/find-tag-conflicts.server'

const INTENT_VALUE = FORM_CONFIG.intent.value

type Options = {
  name: string
  slug: string
  requestedAuthorId: string | undefined
  intent: string
}

type Result =
  | { status: 'success'; id: string; authorId: string }
  | ({ status: 'conflict' } & TaxonomyConflicts)

/**
 * Creates a tag as a draft from the add dialog (design 25c). The caller
 * has checked the session (`checkCSRF`) and publishes or submits it next.
 *
 * @param request - The action's request.
 * @param options.requestedAuthorId - The author the form sends; only the
 *   Coordinator's choice counts, any other role creates for themselves.
 * @param options.intent - The button that saved it, checked against the role
 *   before anything is written.
 * @returns The new tag with its author, or what another tag already
 *   holds, in which case nothing is written.
 * @throws A 403 response for an author or an action the role may not use.
 */
export const createArticleTag = async (
  request: Request,
  { name, slug, requestedAuthorId, intent }: Options,
): Promise<Result> => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['article_tag'],
  })

  const authorId = canChooseRecordAuthor(context.roleLevel)
    ? (requestedAuthorId ?? context.authorId)
    : context.authorId

  checkAuthorPermission(context, {
    action: 'create',
    entity: 'article_tag',
    state: 'draft',
    targetAuthorIds: [authorId],
  })

  // The dialog offers one primary action by role (07c); a forged one is refused
  // before the draft exists.
  if (
    intent !== INTENT_VALUE.saveDraft &&
    intent !== getNewRecordPrimaryIntent(context.roleLevel)
  ) {
    throw data(null, { status: 403 })
  }

  const conflicts = await findTagConflicts({ name, slug })

  if (conflicts.isNameTaken || conflicts.slugSuggestion !== null) {
    return { status: 'conflict', ...conflicts }
  }

  let id: string

  try {
    const tag = await prisma.articleTag.create({
      data: { authorId, name, slug },
      select: { id: true },
    })
    id = tag.id
  } catch (error) {
    // Someone took the address between the check and the write.
    if (isUniqueConstraintError(error)) {
      return {
        status: 'conflict',
        ...(await findTagConflicts({ name, slug })),
      }
    }

    throw error
  }

  await recordContentLog(
    { entity: 'article_tag', entityId: id, events: ['create'] },
    context,
  )
  publishContentEvent(
    { change: 'create', entity: 'article_tag', entityId: id },
    context,
  )

  return { authorId, id, status: 'success' }
}
