import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { deletePdfObject } from '~/utils/pdf-store/store-pdf.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const deleteIssue = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'delete',
    entity: 'issue',
    execute: async () => {
      // Capture the cover and PDF store ids before the rows are cascade-deleted.
      const issue = await prisma.issue.findUnique({
        select: {
          cover: { select: { id: true } },
          pdf: { select: { id: true } },
        },
        where: { id: options.id },
      })

      // Delete the row and its cover files (delete-after-DB, handled inside).
      await deleteRowWithImages(
        async () => (issue?.cover ? [issue.cover.id] : []),
        () => prisma.issue.delete({ where: { id: options.id } }),
      )

      // Remove the PDF object too, after the DB delete is durable.
      if (issue?.pdf) {
        await deletePdfObject(issue.pdf.id)
      }
    },
    target: options.target,
  })
