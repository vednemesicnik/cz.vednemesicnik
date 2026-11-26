import { serveImageVariant } from '~/utils/image-store/serve-image.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { coverId, version, variant } = params
  return serveImageVariant(coverId, version, variant)
}
