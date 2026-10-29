import { useEffect, useRef, useState } from 'react'

import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'
import type { EditHoldContent } from '~/utils/edit-hold/edit-hold-content'
import { getOwnOtherTabDeleteRefusal } from '~/utils/edit-hold/get-own-other-tab-delete-refusal'

const INTENT_VALUE = FORM_CONFIG.intent.value

// Toasts after an action (design 23a, 23b, 23c, 23e, 23f). A delete from the
// detail redirects to the list, which says Smazáno itself.
const ACTION_TOASTS: Record<string, string> = {
  [INTENT_VALUE.archive]: 'Archivováno',
  [INTENT_VALUE.changePublishedAt]: 'Datum publikace změněno',
  [INTENT_VALUE.delete]: 'Smazáno',
  [INTENT_VALUE.publish]: 'Publikováno',
  [INTENT_VALUE.retract]: 'Staženo z publikace',
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

type ActionResult =
  | {
      intent: string
      missing: string[]
      heldByName?: string
      isHeldInOwnOtherTab?: boolean
      /** What the holding editor edits, when it is not the content acted on. */
      heldContent?: EditHoldContent
    }
  | undefined

type Options = {
  /**
   * Toasts that name the record, by intent (`Rubrika schválena`, design 25a);
   * the other intents keep the generic one.
   */
  toasts?: Record<string, string>
  /** What the content is called in a refused action's toast, `článek` by default. */
  heldSubject?: HeldSubject
}

// The refused action's toast names the content in the accusative (copy
// hgb3jeqj, ey73zhul, ahizoh4o).
const HELD_CONTENT = {
  epizodu: 'episode',
  podcast: 'podcast',
  článek: 'article',
  číslo: 'issue',
} as const satisfies Record<string, EditHoldContent>

type HeldSubject = keyof typeof HELD_CONTENT

const HELD_SUBJECT = Object.fromEntries(
  Object.entries(HELD_CONTENT).map(([subject, content]) => [content, subject]),
) as Record<EditHoldContent, HeldSubject>

/**
 * Answers a content action's result once (design 23h): a toast, or the list of
 * what is missing before the content can be submitted or published.
 *
 * @param actionResult - The keyed fetcher's data, `{ intent, missing }`, and
 *   `heldByName` when the content's edit hold refused it, with
 *   `isHeldInOwnOtherTab` when a delete waited for one's own other tab (0036).
 * @param options - The record's own toasts, and what a refused action's
 *   toast calls the content.
 * @returns The missing list to show, `null` when there is none, and setters to
 *   show one up front (the detail checks before publishing) or close it.
 */
export const useContentActionResult = (
  actionResult: ActionResult,
  { toasts, heldSubject = 'článek' }: Options = {},
) => {
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

    // The holding editor's content, which may be another than the one acted
    // on (an empty episode draft holds up its podcast's delete).
    const subject =
      actionResult.heldContent === undefined
        ? heldSubject
        : HELD_SUBJECT[actionResult.heldContent]

    // One's own editor in another tab holds it; the delete waits (0036).
    if (actionResult.isHeldInOwnOtherTab === true) {
      showToast(getOwnOtherTabDeleteRefusal(HELD_CONTENT[subject]))
      return
    }

    // Someone took the edit hold meanwhile; nothing changed (07g, copy
    // hgb3jeqj, ey73zhul).
    if (actionResult.heldByName !== undefined) {
      showToast(
        `Zkuste akci později — ${subject} právě upravuje ${actionResult.heldByName}. Akce se neprovedla.`,
      )
      return
    }

    if (actionResult.missing.length > 0) {
      setMissingList({
        intent: actionResult.intent,
        items: actionResult.missing,
      })
      return
    }

    const toast =
      toasts?.[actionResult.intent] ?? ACTION_TOASTS[actionResult.intent]
    if (toast !== undefined) showToast(toast)
  }, [showToast, actionResult, toasts, heldSubject])

  return {
    closeMissingList: () => setMissingList(null),
    missingList,
    showMissingList: setMissingList,
  }
}
