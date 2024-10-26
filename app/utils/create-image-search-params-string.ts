export const WIDTH_PARAM = "width"
export const QUALITY_PARAM = "quality"

export function createImageSearchParamsString(
  width?: number,
  quality?: number
) {
  const searchParams = new URLSearchParams()

  if (width !== undefined) {
    searchParams.set(WIDTH_PARAM, `${width}`)
  }

  if (quality !== undefined) {
    searchParams.set(QUALITY_PARAM, `${quality}`)
  }

  if (searchParams.has(WIDTH_PARAM) || searchParams.has(QUALITY_PARAM)) {
    return `?${searchParams.toString()}` as const
  }

  return "" as const
}
