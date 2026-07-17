import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const deleteArticle = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'delete',
    entity: 'article',
    execute: () =>
      deleteRowWithImages(
        async () => {
          const images = await prisma.articleImage.findMany({
            select: { id: true },
            where: { articleId: options.id },
          })
          return images.map((image) => image.id)
        },
        () =>
          // PageSEO is a standalone row keyed by pathname (no FK back to the
          // article), so it must be removed explicitly — otherwise its unique
          // pathname blocks recreating an article with the same slug. Read the
          // slug and delete both rows in one transaction so nothing can change
          // between the read and the deletes.
          prisma.$transaction(async (transaction) => {
            const { slug } = await transaction.article.findUniqueOrThrow({
              select: { slug: true },
              where: { id: options.id },
            })
            await transaction.pageSEO.deleteMany({
              where: { pathname: `/articles/${slug}` },
            })
            return transaction.article.delete({ where: { id: options.id } })
          }),
      ),
    target: options.target,
  })
