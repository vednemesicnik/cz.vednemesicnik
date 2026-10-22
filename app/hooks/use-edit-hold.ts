import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentEvents } from '~/hooks/use-content-events'
import type {
  EditHolder,
  EditHoldResult,
} from '~/utils/edit-hold/edit-hold-result'
import { isChangedWhileAway } from '~/utils/edit-hold/is-changed-while-away'
import type { ContentEventEntity } from '~/utils/sse/content-event'

const INTENT_VALUE = FORM_CONFIG.intent.value

/** Where the editor stands with the edit hold (design 07g, 24g–24i). */
export type EditHoldState =
  | { status: 'taking' }
  | { status: 'holding' }
  | { status: 'own-other-tab' }
  | { status: 'held-by-other'; holder: EditHolder }
  /**
   * Taken over (24g, 24h): who holds it now, one's own other tab included;
   * `null` once it is free again. `isEditable` is false once it left the
   * draft, so reloading the editor would not help.
   */
  | { status: 'lost'; holder: EditHolder | null; isEditable: boolean }
  /**
   * Saved elsewhere while this editor had no hold (24i), with who holds it
   * now and how long the editor heard nothing from the server.
   */
  | {
      status: 'changed'
      holder: EditHolder | null
      isEditable: boolean
      awayMilliseconds: number
    }
  /**
   * The content is gone (24k, 26m; decision 0036). For good: the editor only
   * reads and never asks for the hold again.
   */
  | { status: 'deleted' }

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
 * An editor that lost the hold only reads (24h, 24i) and never takes it back by
 * itself: each renewal asks who holds it now, so it can say when it is free,
 * and the edit comes back with a reload. The one exception is an expiry while
 * away with nothing saved meanwhile: the hold is taken again silently (24i).
 * An editor whose content was deleted only reads for good: it asks nothing
 * more and never takes the hold again (24k, 26m; decision 0036).
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
 *   dialog the takeover closed), `takeOver` for the 24g dialogs,
 *   `acknowledgeSave`, `retake` (resolves `true` once holding again) and
 *   `recheck` for a save the server refused.
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
  // Read when the page goes away; a reload of the data must not re-take.
  const isEmptyRef = useRef(isEmpty)
  isEmptyRef.current = isEmpty
  // False once the editor is gone: a take answered after that is released.
  const isActiveRef = useRef(false)
  // The last answer from the server, a hold request's or a save's: how long
  // the editor was away tells 24i from 24h.
  const lastContactAtRef = useRef(0)
  const getSilence = () =>
    lastContactAtRef.current === 0 ? 0 : Date.now() - lastContactAtRef.current

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
      lastContactAtRef.current = Date.now()
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

  // Set while a leave save is on its way: it ends the hold itself.
  const isLeaveSaveSentRef = useRef(false)

  // A waiting save goes out instead of the release and ends the hold itself.
  // Sent from `beforeunload`, before a reload asks for the new page, so the
  // reload more likely loads it (decision 0022). Its answer can come while the
  // page is still going away, so it only learns the save: a page that stays
  // after all takes the hold again with its next renewal.
  const sendLeaveSave = useEffectEvent((): boolean => {
    const formData = leaveSave?.getFormData() ?? null
    if (leaveSave === undefined || formData === null) return false

    formData.append(EDIT_HOLD_CONFIG.releaseHoldName, 'true')
    isLeaveSaveSentRef.current = true

    void fetch(leaveSave.action, {
      body: formData,
      keepalive: true,
      method: 'POST',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { status: string; updatedAt?: string } | null) => {
        if (result?.status === 'saved' && result.updatedAt !== undefined) {
          loadedUpdatedAtRef.current = result.updatedAt
        }
      })
      .catch(() => undefined)

    return true
  })

  // `silence` is how long the editor heard nothing before the request.
  const apply = (result: EditHoldResult | null, silence: number) => {
    if (result === null || result.status === 'released') return

    // Deleted is final: an answer that crossed it changes nothing (0036).
    if (stateRef.current.status === 'deleted') return

    if (result.status === 'deleted') {
      setState(result)
      return
    }

    // Holding again: a later leave goes out as usual.
    if (result.status === 'holding') isLeaveSaveSentRef.current = false

    if (result.status === 'changed') {
      setState({ ...result, awayMilliseconds: silence })
      return
    }

    if (result.status === 'lost') {
      const { holder } = result
      setState(
        holder !== null &&
          isChangedWhileAway({
            awayMilliseconds: silence,
            holder,
            ownLastSavedAt: loadedUpdatedAtRef.current,
          })
          ? {
              awayMilliseconds: silence,
              holder,
              isEditable: true,
              status: 'changed',
            }
          : { holder, isEditable: true, status: 'lost' },
      )
      return
    }

    setState(result)
  }

  // An editor that only reads asks who holds it now; a renewal from a tab
  // without the hold writes nothing (24h: *Článek lze znovu upravovat*).
  const watch = async () => {
    const result = await post(action, buildFormData(INTENT_VALUE.renewEditHold))

    setState((current) => {
      if (current.status !== 'lost' && current.status !== 'changed') {
        return current
      }
      if (result?.status === 'deleted') return result
      if (result?.status === 'lost')
        return { ...current, holder: result.holder }
      if (result?.status === 'changed' && !result.isEditable) {
        return { ...current, holder: null, isEditable: false }
      }
      return current
    })
  }

  // A page that loaded just before its own leave save landed meets that save
  // on its first take. Nothing is typed yet, so it loads again instead of
  // answering `changed`; once in 10 s, so a busy article cannot loop it.
  const reloadOnce = () => {
    const key = `edit-hold-reload:${entity}:${id}`

    try {
      if (Date.now() - Number(sessionStorage.getItem(key)) < 10_000) {
        return false
      }
      sessionStorage.setItem(key, String(Date.now()))
    } catch {
      return false
    }

    window.location.reload()
    return true
  }

  // `silence` defaults to the time since the last answer; a renewal that
  // found the hold gone passes its own, measured before it was sent.
  const take = useEffectEvent(
    async ({
      isPageLoad = false,
      silence = getSilence(),
    }: {
      isPageLoad?: boolean
      silence?: number
    } = {}): Promise<boolean> => {
      const result = await post(
        action,
        buildFormData(INTENT_VALUE.takeEditHold),
      )

      // The editor went away while the take was on its way.
      if (!isActiveRef.current) {
        if (result?.status === 'holding') sendRelease(action)
        return false
      }

      if (isPageLoad && result?.status === 'changed' && reloadOnce()) {
        return false
      }

      apply(result, silence)
      return result?.status === 'holding'
    },
  )

  const renew = useEffectEvent(async () => {
    const { status } = stateRef.current

    // Gone for good: nothing more to ask (0036).
    if (status === 'deleted') return

    if (status === 'lost' || status === 'changed') {
      await watch()
      return
    }

    if (status !== 'holding') {
      await take()
      return
    }

    const silence = getSilence()
    const result = await post(action, buildFormData(INTENT_VALUE.renewEditHold))

    // Expired and nobody took it: back, if nothing was saved meanwhile (24i).
    if (result?.status === 'lost' && result.holder === null) {
      await take({ silence })
      return
    }

    apply(result, silence)
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
    void take({ isPageLoad: true })

    const interval = setInterval(
      () => void renew(),
      EDIT_HOLD_CONFIG.renewIntervalMilliseconds,
    )

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void renew()
    }
    const handleBeforeUnload = () => {
      if (!isLeaveSaveSentRef.current) sendLeaveSave()
    }
    // An empty draft would go with the release (0020), but a reload must find
    // it: its hold only expires, and the sweep clears it otherwise.
    const handlePageHide = () => {
      if (isLeaveSaveSentRef.current || sendLeaveSave()) return
      sendRelease(action, isEmptyRef.current)
    }
    // Back from the back/forward cache, the released hold is taken again; after
    // a leave save the page loads afresh, since its form is older than the save.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      // An editor that lost the hold only reads, also after coming back
      // (decision 0023): the edit returns only with a reload.
      const { status } = stateRef.current
      if (status === 'lost' || status === 'changed' || status === 'deleted') {
        return
      }
      if (isLeaveSaveSentRef.current) {
        window.location.reload()
      } else {
        void take()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
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
  }, [action])

  // A takeover or a delete elsewhere reaches this tab at once, not with the
  // next renewal (0036).
  useContentEvents({
    filter: (event) =>
      event.entity === entity &&
      event.entityId === id &&
      (event.change === 'hold' || event.change === 'delete'),
    onEvent: () => void renew(),
    revalidator: NO_REVALIDATION,
  })

  // A takeover that did not get through asks the server again, and a new
  // attempt brings the closed dialog back with what holds now.
  const takeOver = async () => {
    const silence = getSilence()
    const result = await post(
      action,
      buildFormData(INTENT_VALUE.takeOverEditHold),
    )

    if (result === null) {
      await take()
    } else {
      apply(result, silence)
    }

    setAttempt((current) => current + 1)
  }

  const acknowledgeSave = (savedUpdatedAt: string) => {
    loadedUpdatedAtRef.current = savedUpdatedAt
    lastContactAtRef.current = Date.now()
  }

  // A save refused with nobody holding it (24i): back if nothing was saved
  // meanwhile, so the save can go again.
  const retake = () => take()

  // A save refused for someone else: who holds it now, without waiting for
  // the next renewal.
  const recheck = () => renew()

  return {
    acknowledgeSave,
    attempt,
    recheck,
    retake,
    state,
    tabId,
    takeOver,
  }
}
