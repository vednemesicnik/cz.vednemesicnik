import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { AUTOSAVE_CONFIG } from '~/config/autosave-config'
import { buildAutosaveFormData } from '~/utils/autosave/build-autosave-form-data'
import { canSendWithKeepalive } from '~/utils/autosave/can-send-with-keepalive'

/**
 * Where a Document's autosave stands (design 24e): `pending` waits for the
 * pause after typing, `saving` has a save on its way, `offline` waits for the
 * network, `failed` was refused or broke and waits for *Zkusit znovu*,
 * `stopped` lost the edit hold and sends nothing more.
 */
export type AutosaveStatus =
  | 'idle'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'offline'
  | 'failed'
  | 'stopped'

/** How one save ended, as the page's `send` reports it. */
export type AutosaveSendResult = 'saved' | 'offline' | 'failed' | 'stopped'

type Options = {
  isEnabled: boolean
  getFormData: () => FormData | null
  send: (formData: FormData) => Promise<AutosaveSendResult>
}

/**
 * Saves a Document by itself (design 24e, decision 0022): about a second after
 * the last change, at once with `flush` (leaving a field, the save shortcut,
 * *Zavřít*). Every save sends the whole form; one is on its way at a time, and
 * changes made meanwhile go with the next. A file goes until a save has it.
 * Without a network it tries again on its own; a refused or broken save waits
 * for `retry`. Leaving the page asks through the browser's own dialog only
 * when the changes cannot go out: offline, after a failure, without the hold,
 * or when what waits is too big to send while the page closes.
 *
 * @param options - Whether the editor may save (it holds the edit), the form's
 *   fields, and `send`, which posts one save and reports how it ended.
 * @returns The status, `markChanged` for every edit, `flush` (resolves `true`
 *   once nothing waits that could still go), `retry`, `hasUnsavedChanges`,
 *   `getLeaveSave` with what a closing page should still send, or `null`, and
 *   `stop` for a lost hold (resolves whether anything stayed unsent).
 */
export const useAutosave = ({ isEnabled, getFormData, send }: Options) => {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const statusRef = useRef<AutosaveStatus>('idle')
  const optionsRef = useRef({ getFormData, isEnabled, send })
  optionsRef.current = { getFormData, isEnabled, send }

  const isDirtyRef = useRef(false)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedDisplayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedFilesRef = useRef(new WeakSet<File>())
  // Counts the saves started, so `flush` sees when none could start.
  const startedSavesRef = useRef(0)

  const changeStatus = (next: AutosaveStatus) => {
    statusRef.current = next
    setStatus(next)
  }

  const clearDebounce = () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    debounceRef.current = null
  }

  const buildPayload = () => {
    const formData = optionsRef.current.getFormData()
    return formData === null
      ? null
      : buildAutosaveFormData(formData, savedFilesRef.current)
  }

  // `force` is *Zkusit znovu*, leaving and the network coming back: a failed
  // save does not go again by itself.
  const runSave = (force = false): Promise<void> => {
    if (inFlightRef.current !== null) return inFlightRef.current
    if (
      !isDirtyRef.current ||
      !optionsRef.current.isEnabled ||
      statusRef.current === 'stopped' ||
      (statusRef.current === 'failed' && !force)
    ) {
      return Promise.resolve()
    }

    const payload = buildPayload()
    if (payload === null) return Promise.resolve()

    isDirtyRef.current = false
    startedSavesRef.current += 1
    if (savedDisplayRef.current !== null) clearTimeout(savedDisplayRef.current)
    changeStatus('saving')
    const startedAt = Date.now()

    const flight = (async () => {
      let result: AutosaveSendResult

      try {
        result = await optionsRef.current.send(payload)
      } catch {
        result = 'failed'
      }

      inFlightRef.current = null

      // Refused: what it carried stays unsent (24h).
      if (result === 'stopped') {
        isDirtyRef.current = true
        changeStatus('stopped')
        return
      }

      // Stopped while it was on its way: it says only whether it got through.
      if (statusRef.current === 'stopped') {
        if (result !== 'saved') isDirtyRef.current = true
        return
      }

      if (result !== 'saved') {
        isDirtyRef.current = true
        changeStatus(result)
        return
      }

      for (const [, value] of payload) {
        if (typeof value !== 'string') savedFilesRef.current.add(value)
      }

      // Changed while saving: the pause already passed, so the next one goes.
      if (isDirtyRef.current) {
        if (debounceRef.current === null) await runSave()
        return
      }

      // „ukládá se“ stays at least 300 ms (24e).
      const remaining =
        AUTOSAVE_CONFIG.minimumSavingMilliseconds - (Date.now() - startedAt)
      const showSaved = () => {
        savedDisplayRef.current = null
        if (
          statusRef.current === 'saving' &&
          !isDirtyRef.current &&
          inFlightRef.current === null
        ) {
          changeStatus('saved')
        }
      }

      if (remaining > 0) {
        savedDisplayRef.current = setTimeout(showSaved, remaining)
      } else {
        showSaved()
      }
    })()

    inFlightRef.current = flight
    return flight
  }

  const markChanged = () => {
    if (!optionsRef.current.isEnabled || statusRef.current === 'stopped') {
      return
    }

    isDirtyRef.current = true

    // „ukládá se“ from the first letter (24e); offline and failed stay said.
    if (statusRef.current !== 'offline' && statusRef.current !== 'failed') {
      changeStatus('pending')
    }

    clearDebounce()
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void runSave()
    }, AUTOSAVE_CONFIG.debounceMilliseconds)
  }

  const flush = async (): Promise<boolean> => {
    clearDebounce()

    while (true) {
      if (inFlightRef.current !== null) {
        await inFlightRef.current
        continue
      }

      if (!isDirtyRef.current || statusRef.current === 'stopped') return true

      const startedSaves = startedSavesRef.current
      await runSave(true)

      // Without the hold (or a form) nothing could go: not saved.
      if (startedSavesRef.current === startedSaves) return false

      if (statusRef.current === 'offline' || statusRef.current === 'failed') {
        return false
      }
    }
  }

  // The hold went elsewhere (24h, 24i): nothing more goes. Resolves, once a
  // save on its way has its answer, whether anything stayed unsent.
  const stop = async (): Promise<boolean> => {
    clearDebounce()
    changeStatus('stopped')
    if (inFlightRef.current !== null) await inFlightRef.current
    return isDirtyRef.current
  }

  const hasUnsavedChanges = () =>
    statusRef.current !== 'stopped' &&
    (isDirtyRef.current || inFlightRef.current !== null)

  // Offline, after a failure or without the hold, a closing page cannot send
  // it either: the hold is released as usual and the browser asks.
  const getLeaveSave = () => {
    const current = statusRef.current
    if (
      !hasUnsavedChanges() ||
      !optionsRef.current.isEnabled ||
      current === 'offline' ||
      current === 'failed'
    ) {
      return null
    }

    const payload = buildPayload()
    return payload !== null && canSendWithKeepalive(payload) ? payload : null
  }

  const retryWhenOnline = useEffectEvent(() => void runSave(true))

  const handleBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    const current = statusRef.current
    const cannotLeaveSafely =
      current === 'offline' ||
      current === 'failed' ||
      (hasUnsavedChanges() && getLeaveSave() === null)

    if (cannotLeaveSafely) {
      event.preventDefault()
      // Older Safari and Chromium ask only with a return value.
      event.returnValue = ''
    }
  })

  // The hold back (24i: taken again after an expiry): what waited goes.
  const sendWaiting = useEffectEvent(() => void runSave())
  useEffect(() => {
    if (isEnabled) sendWaiting()
  }, [isEnabled])

  // Without a network: again when it is back, and every few seconds.
  useEffect(() => {
    if (status !== 'offline') return

    const interval = setInterval(
      retryWhenOnline,
      AUTOSAVE_CONFIG.offlineRetryMilliseconds,
    )
    window.addEventListener('online', retryWhenOnline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', retryWhenOnline)
    }
  }, [status])

  // The browser's own dialog, only for changes that cannot go out (24e).
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) =>
      handleBeforeUnload(event)

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(
    () => () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
      if (savedDisplayRef.current !== null) {
        clearTimeout(savedDisplayRef.current)
      }
    },
    [],
  )

  return {
    flush,
    getLeaveSave,
    hasUnsavedChanges,
    markChanged,
    retry: () => void flush(),
    status,
    stop,
  }
}
