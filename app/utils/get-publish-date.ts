import { type ContentState } from "@generated/prisma/enums"

export const getPublishDate = (
  publishedAt: string | undefined,
  state: ContentState
) => {
  // Should be published and was not published yet
  if (state === "published" && publishedAt === undefined) {
    return new Date()
  }

  // Is already published
  if (publishedAt !== undefined) {
    return new Date(publishedAt)
  }

  // Do not have to be published and was not published yet
  return null
}
