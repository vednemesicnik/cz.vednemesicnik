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
  /** An empty draft is deleted with its release (0020), so a reload keeps it. */
  isEmpty: boolean
  /**
   * What autosave still has to send when the page goes away: that save, which
   * also ends the hold, goes instead of the release (decision 0022).
   */
  leaveSave?: { action: string; getFormData: () => FormData | null }
}

// The editor's own events don't need the page's data reloaded.
const NO_REVALIDATION = { revalidate: () => undefined, state: 'idle' }

/**
 * Holds the edit for this tab while the editor is open (design 07g, 24g;
 * decision 0019). Takes the hold once the page runs, renews it about every
 * 30 s, on coming back to the tab and whenever someone else touches it, and
 * releases it when the editor goes away, the tab closes or the page is hidden
 * in the back/forward cache. Every take and takeover carries the content's
 * last save as the editor loaded it: over a newer one it answers `changed`
 * instead of letting this editor overwrite it (24i). An editor without the hold
 * (a failed take, someone else's hold, one's own in another tab) tries again
 * with each renewal, so it gets the edit once it is free.
 *
 * The tab id lives for one page load: a duplicated tab copies `sessionStorage`,
 * so it would share the hold with its original. Autosave reports each of its
 * saves with `acknowledgeSave`, so taking the hold back after an expiry
 * compares against this tab's own last save (24i). When the page goes away with
 * a save still waiting, that save goes out and ends the hold in one request,
 * so it cannot race the release.
 *
 * @param options - The hold endpoint, the content, its last save, whether it
 *   is an empty draft, and the save to send instead of the release.
 * @returns The tab id for the save form (`null` until the page runs), the
 *   hold's state, `attempt` (a new one after each takeover, to bring back a
 *   dialog the takeover closed), `takeOver` for the 24g dialogs, and
 *   `acknowledgeSave`.
 */
export const useEditHold = ({
  action,
  entity,
  id,
  updatedAt,
  isEmpty,
  leaveSave,
}: Options) => {
  // Made in the browser, once the page runs: a server-rendered id would differ
  // from the hydrated one.
  const [tabId, setTabId] = useState<string | null>(null)
  const tabIdRef = useRef('')
  const authenticityToken = useAuthenticityToken()
  const [state, setState] = useState<EditHoldState>({ status: 'taking' })
  const [attempt, setAttempt] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state
  // The form keeps what it loaded, whatever a later load brings, and moves
  // only with its own saves (24i).
  const loadedUpdatedAtRef = useRef(updatedAt)
  // False once the editor is gone: a take answered after that is released.
  const isActiveRef = useRef(false)

  const buildFormData = (intent: string) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(FORM_CONFIG.intent.name, intent)
    formData.append(EDIT_HOLD_CONFIG.tabIdName, tabIdRef.current)
    formData.append(
      EDIT_HOLD_CONFIG.expectedUpdatedAtName,
      loadedUpdatedAtRef.current,
    )
    return formData
  }

  // A failed request (offline, an expired session) changes nothing: the next
  // renewal tries again, and the hold expires by itself if it never gets through.
  const post = async (target: string, formData: FormData) => {
    try {
      const response = await fetch(target, { body: formData, method: 'POST' })
      return response.ok ? ((await response.json()) as EditHoldResult) : null
    } catch {
      return null
    }
  }

  // `keepalive` lets the request outlive the page that sends it; the server
  // releases only this tab's hold, so a release with none is harmless.
  const sendRelease = useEffectEvent((target: string, keepEmpty = false) => {
    const formData = buildFormData(INTENT_VALUE.releaseEditHold)
    if (keepEmpty) formData.append(EDIT_HOLD_CONFIG.keepEmptyName, 'true')

    void fetch(target, {
      body: formData,
      keepalive: true,
      method: 'POST',
    }).catch(() => undefined)
  })

  // A waiting save goes out instead of the release and ends the hold itself.
  const sendLeave = useEffectEvent((target: string, keepEmpty: boolean) => {
    const formData = leaveSave?.getFormData() ?? null

    if (leaveSave === undefined || formData === null) {
      sendRelease(target, keepEmpty)
      return
    }

    formData.append(EDIT_HOLD_CONFIG.releaseHoldName, 'true')
    void fetch(leaveSave.action, {
      body: formData,
      keepalive: true,
      method: 'POST',
    }).catch(() => undefined)
  })

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

  const take = useEffectEvent(async () => {
    const result = await post(action, buildFormData(INTENT_VALUE.takeEditHold))

    // The editor went away while the take was on its way.
    if (!isActiveRef.current) {
      if (result?.status === 'holding') sendRelease(action)
      return
    }

    apply(result)
  })

  const renew = useEffectEvent(async () => {
    const { status } = stateRef.current

    // Lost, or saved elsewhere: the read-only editor of #671 takes it from here.
    if (status === 'lost' || status === 'changed') return

    if (status !== 'holding') {
      await take()
      return
    }

    const result = await post(action, buildFormData(INTENT_VALUE.renewEditHold))

    // Expired and nobody took it: back, if nothing was saved meanwhile (24i).
    if (result?.status === 'lost' && result.holder === null) {
      await take()
      return
    }

    apply(result)
  })

  // A remount right after the unmount (React's development double mount) keeps
  // the tab and its hold: the release waits a tick and the remount cancels it.
  // Moving to another article's editor releases the first one.
  const pendingReleaseRef = useRef<{
    action: string
    timer: ReturnType<typeof setTimeout>
  } | null>(null)

  useEffect(() => {
    const pendingRelease = pendingReleaseRef.current

    if (pendingRelease !== null && pendingRelease.action === action) {
      clearTimeout(pendingRelease.timer)
      pendingReleaseRef.current = null
    }

    isActiveRef.current = true

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
    // An empty draft would go with the release (0020), but a reload must find
    // it: its hold only expires, and the sweep clears it otherwise.
    const handlePageHide = () => sendLeave(action, isEmpty)
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
      pendingReleaseRef.current = {
        action,
        timer: setTimeout(() => {
          pendingReleaseRef.current = null
          isActiveRef.current = false
          sendRelease(action)
        }, 0),
      }
    }
  }, [action, isEmpty])

  // A takeover elsewhere reaches this tab at once, not with the next renewal.
  useContentEvents({
    filter: (event) =>
      event.entity === entity &&
      event.entityId === id &&
      event.change === 'hold',
    onEvent: () => void renew(),
    revalidator: NO_REVALIDATION,
  })

  // A takeover that did not get through asks the server again, and a new
  // attempt brings the closed dialog back with what holds now.
  const takeOver = async () => {
    const result = await post(
      action,
      buildFormData(INTENT_VALUE.takeOverEditHold),
    )

    if (result === null) {
      await take()
    } else {
      apply(result)
    }

    setAttempt((current) => current + 1)
  }

  const acknowledgeSave = (savedUpdatedAt: string) => {
    loadedUpdatedAtRef.current = savedUpdatedAt
  }

  return { acknowledgeSave, attempt, state, tabId, takeOver }
}
