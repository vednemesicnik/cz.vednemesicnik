import { useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'

import { useToast } from '~/components/toast-provider'
import type { BulkNoun } from '~/config/bulk-noun-config'
import type { BulkActionResult } from './bulk-action-result'
import { formatBulkActionToast } from './format-bulk-action-toast'

type Options = {
  fetcherKey: string
  noun: BulkNoun
  onClear: () => void
}

/**
 * Answers a bulk action once it has finished (design 22c): the toast with the
 * real result, then a cleared selection. It lives with the list, not the bar:
 * deleted rows leave the selection on revalidation, and the bar is gone before
 * the result arrives.
 *
 * @param options - The keyed fetcher the bar submits through, the list's bulk
 *   noun, and what clears the selection.
 */
export const useBulkActionResult = ({ fetcherKey, noun, onClear }: Options) => {
  const fetcher = useFetcher<BulkActionResult>({ key: fetcherKey })
  const showToast = useToast()
  // A keyed fetcher keeps its data across remounts; answer only a new result.
  const handledResultRef = useRef(fetcher.data)

  useEffect(() => {
    const result = fetcher.data
    if (
      fetcher.state !== 'idle' ||
      result === undefined ||
      result === handledResultRef.current
    ) {
      return
    }
    handledResultRef.current = result

    showToast(formatBulkActionToast({ ...result, noun }))
    onClear()
  }, [fetcher.data, fetcher.state, noun, onClear, showToast])
}
