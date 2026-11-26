import { useEffect, useRef } from 'react'

import { useToast } from '~/components/toast-provider'

type LoaderData = { toast: string | null }

/**
 * Shows the toast an administration action left for this list, such as
 * „Smazáno“ after a delete from the detail (design 23f), once per load.
 *
 * @param loaderData - The list's loader data, carrying the notice `readAdminNotice` read.
 */
export const useAdminNoticeToast = (loaderData: LoaderData) => {
  const showToast = useToast()
  const handledLoaderDataRef = useRef<LoaderData | null>(null)

  useEffect(() => {
    if (
      loaderData.toast === null ||
      handledLoaderDataRef.current === loaderData
    ) {
      return
    }
    handledLoaderDataRef.current = loaderData
    showToast(loaderData.toast)
  }, [loaderData, showToast])
}
