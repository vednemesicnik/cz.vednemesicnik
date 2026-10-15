import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentEvents } from '~/hooks/use-content-events'
import type {
  EditHolder,
  EditHoldResult,
} from '~/utils/edit-hold/edit-hold-result'
import type { ContentEventEntity } from '~/utils/sse/content-event'

const INTENT_VALUE = FORM_CONFIG.intent.value

/** Where the editor stands with the edit hold (design 07g, 24g). */
export type EditHoldState =
  | { status: 'taking' }
  | { status: 'holding' }
  | { status: 'own-other-tab' }
  | { status: 'held-by-other'; holder: EditHolder }
  /** Taken over: who holds it now, one's own other tab included (24g, 24h). */
  | { status: 'lost'; holderName: string }
  /** Saved elsewhere while this editor had no hold (24i). */
  | { status: 'changed' }

type Options = {
  /** The hold endpoint (an action-only route). */
  action: string
  entity: ContentEventEntity
  id: string
  /** The content's last save as the editor loaded it (24i). */
  updatedAt: string
}

// The editor's own events don't need the page's data reloaded.
const NO_REVALIDATION = { revalidate: () => undefined, state: 'idle' }

/**
 * Holds the edit for this tab while the editor is open (design 07g, 24g;
 * decision 0019). Takes the hold once the page runs, renews it about every
 * 30 s, on coming back to the tab and whenever someone else touches it, and
 * releases it when the editor goes away, the tab closes or the page is hidden
 * in the back/forward cache. A hold that expired while nobody took it is taken
 * back only if the content was not saved since (24i).
 *
 * The tab id lives for one page load: a duplicated tab copies `sessionStorage`,
 * so it would share the hold with its original.
 *
 * @param options - The hold endpoint, the content and its last save.
 * @returns The tab id for the save form (`null` until the page runs), the
 *   hold's state, and `takeOver` for the 24g dialogs.
 */
export const useEditHold = ({ action, entity, id, updatedAt }: Options) => {
  // Made in the browser, once the page runs: a server-rendered id would differ
  // from the hydrated one.
  const [tabId, setTabId] = useState<string | null>(null)
  const tabIdRef = useRef('')
  const authenticityToken = useAuthenticityToken()
  const [state, setState] = useState<EditHoldState>({ status: 'taking' })
  const stateRef = useRef(state)
  stateRef.current = state

  const buildFormData = (intent: string) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, intent)
    formData.append(EDIT_HOLD_CONFIG.tabIdName, tabIdRef.current)
    return formData
  }

  // A failed request (offline, an expired session) changes nothing: the next
  // renewal tries again, and the hold expires by itself if it never gets through.
  const post = async (formData: FormData) => {
    try {
      const response = await fetch(action, { body: formData, method: 'POST' })
      return response.ok ? ((await response.json()) as EditHoldResult) : null
    } catch {
      return null
    }
  }

  const apply = (result: EditHoldResult | null) => {
    if (result === null || result.status === 'released') return

    if (result.status === 'lost') {
      setState(
        result.holder === null
          ? { status: 'changed' }
          : { holderName: result.holder.name, status: 'lost' },
      )
      return
    }

    setState(result)
  }

  const take = useEffectEvent(async (expectedUpdatedAt?: string) => {
    const formData = buildFormData(INTENT_VALUE.takeEditHold)
    if (expectedUpdatedAt !== undefined) {
      formData.append(EDIT_HOLD_CONFIG.expectedUpdatedAtName, expectedUpdatedAt)
    }
    apply(await post(formData))
  })

  const renew = useEffectEvent(async () => {
    if (stateRef.current.status !== 'holding') return

    const result = await post(buildFormData(INTENT_VALUE.renewEditHold))

    // Expired and nobody took it: back, if nothing was saved meanwhile (24i).
    if (result?.status === 'lost' && result.holder === null) {
      await take(updatedAt)
      return
    }

    apply(result)
  })

  const release = useEffectEvent(() => {
    if (stateRef.current.status !== 'holding') return

    // `keepalive` lets the request outlive the page that sends it.
    void fetch(action, {
      body: buildFormData(INTENT_VALUE.releaseEditHold),
      keepalive: true,
      method: 'POST',
    }).catch(() => undefined)
  })

  // A remount right after the unmount (React's development double mount) keeps
  // the tab and its hold: the release waits a tick and the remount cancels it.
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (releaseTimerRef.current !== null) {
      clearTimeout(releaseTimerRef.current)
      releaseTimerRef.current = null
    }

    if (tabIdRef.current === '') {
      tabIdRef.current = crypto.randomUUID()
      setTabId(tabIdRef.current)
    }
    void take()

    const interval = setInterval(
      () => void renew(),
      EDIT_HOLD_CONFIG.renewIntervalMilliseconds,
    )

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void renew()
    }
    const handlePageHide = () => release()
    // Back from the back/forward cache, the released hold is taken again.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void take()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
      releaseTimerRef.current = setTimeout(() => {
        releaseTimerRef.current = null
        release()
      }, 0)
    }
  }, [])

  // A takeover elsewhere reaches this tab at once, not with the next renewal.
  useContentEvents({
    filter: (event) =>
      event.entity === entity &&
      event.entityId === id &&
      event.change === 'hold',
    onEvent: () => void renew(),
    revalidator: NO_REVALIDATION,
  })

  const takeOver = async () =>
    apply(await post(buildFormData(INTENT_VALUE.takeOverEditHold)))

  return { state, tabId, takeOver }
}
