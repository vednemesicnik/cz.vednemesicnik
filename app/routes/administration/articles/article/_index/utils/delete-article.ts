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
        async () => {
          // PageSEO is a standalone row keyed by pathname (no FK back to the
          // article), so it must be removed explicitly — otherwise its unique
          // pathname blocks recreating an article with the same slug.
          const { slug } = await prisma.article.findUniqueOrThrow({
            select: { slug: true },
            where: { id: options.id },
          })

          return prisma.$transaction(async (tx) => {
            await tx.pageSEO.deleteMany({
              where: { pathname: `/articles/${slug}` },
            })
            return tx.article.delete({ where: { id: options.id } })
          })
        },
      ),
    target: options.target,
  })
