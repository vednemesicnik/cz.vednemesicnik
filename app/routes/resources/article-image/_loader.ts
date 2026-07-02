import { serveImageVariant } from '~/utils/image-store/serve-image.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { imageId, version, variant } = params
  return serveImageVariant(imageId, version, variant)
}
