import { appendParameters } from "~/utils/append-parameters"

export const WIDTH_SEARCH_PARAM = "width"
export const HEIGHT_SEARCH_PARAM = "height"
export const QUALITY_SEARCH_PARAM = "quality"
export const FORMAT_SEARCH_PARAM = "format"

type Format = "avif" | "webp" | "png" | "jpeg"

export type ImageOptions = {
  width?: number
  height?: number
  quality?: number
  format?: Format
}

type HasDefinedOptions<Options> = Options extends
  | { width: number }
  | { height: number }
  | { quality: number }
  | { format: Format }
  ? true
  : false

type RouteWithSearchParams<Route extends string, Options> =
  HasDefinedOptions<Options> extends true ? `${Route}?${string}` : Route

export function createImageSourceRoute<
  Route extends string,
  Options extends ImageOptions,
>(
  route: Route,
  options?: Options
): RouteWithSearchParams<Route, NonNullable<Options>> {
  const { width, height, quality, format } = options ?? {}

  const searchParams = new URLSearchParams()

  if (width !== undefined) {
    searchParams.set(WIDTH_SEARCH_PARAM, `${width}`)
  }

  if (height !== undefined) {
    searchParams.set(HEIGHT_SEARCH_PARAM, `${height}`)
  }

  if (quality !== undefined) {
    searchParams.set(QUALITY_SEARCH_PARAM, `${quality}`)
  }

  if (format !== undefined) {
    searchParams.set(FORMAT_SEARCH_PARAM, format)
  }

  const routeWithSearchParams = appendParameters(route, searchParams.toString())

  return routeWithSearchParams as RouteWithSearchParams<
    Route,
    NonNullable<Options>
  >
}
