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
        () => prisma.article.delete({ where: { id: options.id } }),
      ),
    target: options.target,
  })
