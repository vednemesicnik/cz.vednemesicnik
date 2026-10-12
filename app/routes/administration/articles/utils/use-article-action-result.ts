import { useEffect, useRef, useState } from 'react'

import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'

const INTENT_VALUE = FORM_CONFIG.intent.value

// Toasts after an action (design 23a, 23b, 23c, 23f).
const ACTION_TOASTS: Record<string, string> = {
  [INTENT_VALUE.publish]: 'Publikováno',
  [INTENT_VALUE.returnForEdits]: 'Vráceno k úpravám',
  [INTENT_VALUE.review]: 'Schváleno',
  [INTENT_VALUE.submitForReview]: 'Odesláno ke schválení',
  [INTENT_VALUE.withdrawSubmission]: 'Vráceno do konceptu',
}

/** What blocks a publish or a submission (23h), by the intent it blocked. */
export type MissingList = {
  intent: string
  items: string[]
}

type ActionResult = { intent: string; missing: string[] } | undefined

/**
 * Answers an article action's result once (design 23h): a toast, or the list of
 * what is missing before the article can be submitted or published.
 *
 * @param actionResult - The keyed fetcher's data, `{ intent, missing }`.
 * @returns The missing list to show, `null` when there is none, and setters to
 *   show one up front (the detail checks before publishing) or close it.
 */
export const useArticleActionResult = (actionResult: ActionResult) => {
  const showToast = useToast()
  const [missingList, setMissingList] = useState<MissingList | null>(null)
  // A keyed fetcher keeps its data across remounts; answer only a new result.
  const handledResultRef = useRef(actionResult)

  useEffect(() => {
    if (
      actionResult === undefined ||
      actionResult === handledResultRef.current
    ) {
      return
    }
    handledResultRef.current = actionResult

    if (actionResult.missing.length > 0) {
      setMissingList({
        intent: actionResult.intent,
        items: actionResult.missing,
      })
      return
    }

    const toast = ACTION_TOASTS[actionResult.intent]
    if (toast !== undefined) showToast(toast)
  }, [showToast, actionResult])

  return {
    closeMissingList: () => setMissingList(null),
    missingList,
    showMissingList: setMissingList,
  }
}
