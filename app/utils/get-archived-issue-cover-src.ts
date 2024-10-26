import { createImageSearchParamsString } from "~/utils/create-image-search-params-string"

export function getArchivedIssueCoverSrc(
  id: string,
  options?: { width?: number; quality?: number }
) {
  const imageSearchParamsString = createImageSearchParamsString(
    options?.width,
    options?.quality
  )

  return `/resources/archived-issue-cover/${id}${imageSearchParamsString}` as const
}
