import { useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'

import { useToast } from '~/components/toast-provider'

import type { action as listAction } from '../_action'
import { BULK_ACTION_FETCHER_KEY } from './bulk-action-fetcher-key'
import { formatBulkActionToast } from './format-bulk-action-toast'

/**
 * Answers a bulk action once it has finished (design 22c): the toast with the
 * real result, then a cleared selection. It lives with the list, not the bar:
 * deleted rows leave the selection on revalidation, and the bar is gone before
 * the result arrives.
 *
 * @param onClear - Clears the selection.
 */
export const useBulkActionResult = (onClear: () => void) => {
  const fetcher = useFetcher<typeof listAction>({
    key: BULK_ACTION_FETCHER_KEY,
  })
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

    showToast(formatBulkActionToast(result))
    onClear()
  }, [fetcher.data, fetcher.state, onClear, showToast])
}
