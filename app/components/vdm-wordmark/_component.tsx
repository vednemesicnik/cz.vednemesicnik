import { clsx } from 'clsx'
import {
  type CSSProperties,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'

import styles from './_styles.module.css'

const NAME = 'Vedneměsíčník'
const MIRRORED_FROM = 'Vedne'.length

// Advance widths of Inter Bold (display optical size) in em, letter by letter,
// so the gradient slices line up from the first paint, without JavaScript.
const ADVANCES = [
  0.7055, 0.5615, 0.5977, 0.5854, 0.5615, 0.8838, 0.5615, 0.52, 0.2456, 0.5554,
  0.5854, 0.2456, 0.5503,
]

// Shared by every page that turns the name (home, /links, sign-in).
const SESSION_KEY = 'vdm-wordmark-turned'
// Long enough to read the name upright before it turns.
const FLIP_DELAY = 1200

const sumAdvances = (advances: number[]) =>
  Number(advances.reduce((sum, advance) => sum + advance, 0).toFixed(4))

const letters = [...NAME].map((character, position) => ({
  advance: ADVANCES[position],
  advanceBefore: sumAdvances(ADVANCES.slice(0, position)),
  character,
  isMirrored: position >= MIRRORED_FROM,
  position,
}))

const nameAdvance = sumAdvances(ADVANCES)

// Runs before the first paint of a server-rendered page: on the first visit of the
// session, it holds the letters upright until the turn starts.
const pendingScript = `(function(element){try{if(sessionStorage.getItem('${SESSION_KEY}')!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){element.setAttribute('data-pending','')}}catch(error){}})(document.currentScript.previousElementSibling)`

const readShouldTurn = () => {
  try {
    return (
      sessionStorage.getItem(SESSION_KEY) !== '1' &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

const subscribe = () => () => {}

// Resolves once the whole page has loaded, images included; at once after a
// client-side navigation, where the load event is long past.
const waitForPageLoad = () =>
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        window.addEventListener('load', () => resolve(), { once: true })
      })

type Props = {
  animate?: boolean
  className?: string
}

/**
 * The magazine's name with „měsíčník" mirrored letter by letter (design 10e). The
 * signature gradient runs across the whole name: every letter paints its own slice,
 * and a mirrored letter paints the slice of the mirrored gradient, so the gradient
 * never breaks.
 *
 * The mirrored name is the server-rendered state, so it shows as it is without
 * JavaScript, with reduced motion, and on a repeat visit. With `animate`, the first
 * visit of the session starts upright and, 1.2 s after the page and the font have
 * loaded, turns the letters one after another; the session flag is shared with the
 * other pages that turn the name.
 *
 * It renders a `span`, so the element around it gives it its meaning and size —
 * `<Headline><VdmWordmark /></Headline>` for a page's main heading. A parent that
 * paints its own text gradient (`Headline`) has it switched off, so the letters
 * paint alone. It has the headline's line height and inherits its letter spacing.
 *
 * Use it only where the name stands alone as the brand, never for „Vedneměsíčník,
 * z. s." or the name inside a sentence.
 *
 * @param animate - Turn „měsíčník" once per session.
 */
export const VdmWordmark = ({ animate = false, className }: Props) => {
  const shouldTurn = useSyncExternalStore(
    subscribe,
    () => animate && readShouldTurn(),
    () => false,
  )
  const [hasTurned, setHasTurned] = useState(false)
  const isPending = shouldTurn && !hasTurned

  useEffect(() => {
    if (!isPending) return

    let timeout: ReturnType<typeof setTimeout> | undefined
    let isCancelled = false

    Promise.all([waitForPageLoad(), document.fonts.ready]).then(() => {
      if (isCancelled) return

      timeout = setTimeout(() => {
        setHasTurned(true)

        try {
          sessionStorage.setItem(SESSION_KEY, '1')
        } catch {
          // Without storage the name turns again on the next visit.
        }
      }, FLIP_DELAY)
    })

    return () => {
      isCancelled = true
      clearTimeout(timeout)
    }
  }, [isPending])

  return (
    <>
      <span
        className={clsx(styles.wordmark, className)}
        data-pending={isPending ? '' : undefined}
        suppressHydrationWarning
      >
        <span className={'screen-reader-only'}>{NAME}</span>
        <span
          aria-hidden
          className={styles.letters}
          style={{ '--name-advance': nameAdvance } as CSSProperties}
        >
          {letters.map((letter) => (
            <span
              className={clsx(
                styles.letter,
                letter.isMirrored && styles.mirroredLetter,
              )}
              key={letter.position}
              style={
                {
                  '--advance': letter.advance,
                  '--advance-before': letter.advanceBefore,
                  '--position': letter.position,
                  ...(letter.isMirrored && {
                    '--flip-index': letter.position - MIRRORED_FROM,
                  }),
                } as CSSProperties
              }
            >
              {letter.character}
            </span>
          ))}
        </span>
      </span>
      {animate && (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a static script, no user input
          dangerouslySetInnerHTML={{ __html: pendingScript }}
        />
      )}
    </>
  )
}
