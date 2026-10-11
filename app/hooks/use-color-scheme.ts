import { ColorScheme } from '@generated/prisma/enums'
import { useFetcher, useRouteLoaderData } from 'react-router'

import { COLOR_SCHEME_CONFIG } from '~/config/color-scheme-config'
import type { loader } from '~/routes/administration/__layout-authenticated/_loader'

const isColorScheme = (value: unknown): value is ColorScheme =>
  Object.values(ColorScheme).some((colorScheme) => colorScheme === value)

/**
 * The administration's colour scheme (design 29a): the one being saved while
 * Settings submits it, so the page changes on click, otherwise the account's.
 * Outside the authenticated administration it is always `system`.
 *
 * @returns The colour scheme to render.
 */
export const useColorScheme = (): ColorScheme => {
  const layoutData = useRouteLoaderData<typeof loader>(
    COLOR_SCHEME_CONFIG.layoutRouteId,
  )
  const fetcher = useFetcher({ key: COLOR_SCHEME_CONFIG.fetcherKey })
  const pendingColorScheme = fetcher.formData?.get(
    COLOR_SCHEME_CONFIG.fieldName,
  )

  if (isColorScheme(pendingColorScheme)) {
    return pendingColorScheme
  }

  return layoutData?.colorScheme ?? ColorScheme.system
}
