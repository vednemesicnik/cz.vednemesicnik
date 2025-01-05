import { contentStateConfig } from "~/config/content-state-config"
import { type ContentState } from "~~/types/content-state"

export const getPublishDate = (
  publishedAt: string | undefined,
  state: string
) => {
  const publicationState = state as ContentState

  // State is not supported
  if (!contentStateConfig.states.includes(publicationState)) {
    throw new Error(`Unsupported state "${state}" in getPublishDate function`)
  }

  // Should be published and was not published yet
  if (publicationState === "published" && publishedAt === undefined) {
    return new Date()
  }

  // Is already published
  if (publishedAt !== undefined) {
    return new Date(publishedAt)
  }

  // Do not have to be published and was not published yet
  return null
}
