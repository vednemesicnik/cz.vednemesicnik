import type { PrismaClient } from '@generated/prisma/client'

export type EditorialBoardPositionsData = {
  key: 'chief-editor' | 'editor' | 'proofreader' | 'artist' | 'developer'
  pluralLabel: string
  order: number
}[]

export const createEditorialBoardPositions = async (
  prisma: PrismaClient,
  data: EditorialBoardPositionsData,
  authorId: string,
) => {
  for (const position of data) {
    await prisma.editorialBoardPosition
      .create({
        data: {
          authorId: authorId,
          key: position.key,
          order: position.order,
          pluralLabel: position.pluralLabel,
        },
      })
      .catch((error) => {
        console.error(
          'Error creating an editorial board member position:',
          error,
        )
        return null
      })
  }
}
