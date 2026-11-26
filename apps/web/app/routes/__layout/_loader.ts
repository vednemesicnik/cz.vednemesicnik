import { getPreviewMode } from '~/utils/reader-view/get-preview-mode.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => ({
  previewMode: await getPreviewMode(request),
})
