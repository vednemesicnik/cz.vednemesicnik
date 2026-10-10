import { clsx } from 'clsx'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Toast, type ToastTone } from '~/components/toast'

import styles from './_styles.module.css'
import { getToastDuration } from './utils/get-toast-duration'

// Hovered or focused, the countdown resumes with at least this much left (design g5).
const MINIMUM_REMAINING_MS = 2000

// Matches the exit fade in the stylesheet.
const EXIT_MS = 150

type ToastState = {
  id: number
  message: string
  tone: ToastTone
}

// Context

type ShowToast = (message: string, tone?: ToastTone) => void

const Context = createContext<ShowToast | undefined>(undefined)

const noop: ShowToast = () => {}

// Active toast

type ActiveToastProps = {
  onExpire: () => void
  toast: ToastState
}

// Counts down while the tab is visible and the toast is neither hovered nor
// focused, then fades out (design g5, fezlur0t).
const ActiveToast = ({ onExpire, toast }: ActiveToastProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (element === null) return

    let remaining = getToastDuration(toast.message, toast.tone)
    let startedAt = 0
    let timeout: ReturnType<typeof setTimeout> | undefined
    let exitTimeout: ReturnType<typeof setTimeout> | undefined
    let isHeld = false

    const expire = () => {
      timeout = undefined
      setIsLeaving(true)
      exitTimeout = setTimeout(onExpire, EXIT_MS)
    }

    const start = () => {
      if (timeout !== undefined || isHeld) return
      if (document.visibilityState !== 'visible') return

      startedAt = Date.now()
      timeout = setTimeout(expire, remaining)
    }

    const stop = () => {
      if (timeout === undefined) return

      clearTimeout(timeout)
      timeout = undefined
      remaining -= Date.now() - startedAt
    }

    const hold = () => {
      isHeld = true
      stop()
    }

    const release = () => {
      isHeld = false
      remaining = Math.max(remaining, MINIMUM_REMAINING_MS)
      start()
    }

    const handleVisibilityChange = () =>
      document.visibilityState === 'visible' ? start() : stop()

    element.addEventListener('pointerenter', hold)
    element.addEventListener('pointerleave', release)
    element.addEventListener('focusin', hold)
    element.addEventListener('focusout', release)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    start()

    return () => {
      clearTimeout(timeout)
      clearTimeout(exitTimeout)
      element.removeEventListener('pointerenter', hold)
      element.removeEventListener('pointerleave', release)
      element.removeEventListener('focusin', hold)
      element.removeEventListener('focusout', release)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onExpire, toast])

  return (
    <div className={clsx(styles.slot, isLeaving && styles.leaving)} ref={ref}>
      <Toast className={styles.toast} tone={toast.tone}>
        {toast.message}
      </Toast>
    </div>
  )
}

// Provider

type Props = {
  children: ReactNode
}

/**
 * The toast region of the administration, always in the layout so a screen
 * reader announces what lands in it (design g5). One toast at a time: a new one
 * replaces the old at once. The region is a manual popover, so it paints above
 * the page, and above an open modal dialog too.
 */
export const ToastProvider = ({ children }: Props) => {
  const regionRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(0)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    const region = regionRef.current
    if (region === null || typeof region.showPopover !== 'function') return

    region.showPopover()
    return () => region.hidePopover()
  }, [])

  const showToast = useCallback<ShowToast>((message, tone = 'neutral') => {
    const region = regionRef.current

    // A modal dialog opened after the region sits above it in the top layer;
    // showing the region again puts it on top.
    if (
      region !== null &&
      typeof region.showPopover === 'function' &&
      document.querySelector('dialog:modal') !== null
    ) {
      region.hidePopover()
      region.showPopover()
    }

    nextIdRef.current += 1
    setToast({ id: nextIdRef.current, message, tone })
  }, [])

  const handleExpire = useCallback(() => setToast(null), [])

  const activeToast =
    toast === null ? null : (
      <ActiveToast key={toast.id} onExpire={handleExpire} toast={toast} />
    )

  return (
    <Context.Provider value={showToast}>
      {children}
      <div className={styles.region} popover={'manual'} ref={regionRef}>
        <div role={'status'}>{toast?.tone === 'neutral' && activeToast}</div>
        <div role={'alert'}>{toast?.tone === 'error' && activeToast}</div>
      </div>
    </Context.Provider>
  )
}

// Hooks

/**
 * @returns `showToast(message, tone?)`, which shows a toast in the nearest
 *   `ToastProvider`; a no-op outside it (e.g. in Storybook).
 */
export const useToast = (): ShowToast => useContext(Context) ?? noop
