import type { Handle } from 'remix/component'
import { clientEntry, on, ref } from 'remix/component'
import { tied } from '../../../domain/public/typography.ts'

/**
 * One item of the menu: a link, which opens a new tab unless it stays in the app; a copy of a
 * text to the clipboard, as _Kopírovat odkaz na nahrání děl_; an action sent at once as a `POST`
 * with the page's CSRF token, as _Poslat žádost znovu_; or a line between groups.
 */
export type ActionMenuItem =
  | {
      href: string
      /** An item that stays in the app, like _Vydat nový odkaz…_; the rest open a new tab. */
      isSameTab?: boolean
      label: string
    }
  | { copyText: string; label: string }
  | { action: string; csrfToken: string; label: string }
  | { isSeparator: true }

/** What a screen reader hears after a copy, the design system's word for it. */
const COPIED_LABEL = 'Zkopírováno'

export type ActionMenuProps = {
  /** Names the trigger, which shows only `⋯`: _Další akce VDM_2026_5_. */
  label: string
  items: readonly ActionMenuItem[]
}

/**
 * The design system's `ActionMenu` on a row (`11a`): `⋯` opens a short list of shortcuts below
 * it. Its items are links, a copy and a form or two, so it is a list that `Tab` walks rather than
 * an arrow-key menu, and it carries no `menu` roles. A click elsewhere or Escape closes it, Escape
 * returning focus to `⋯`.
 *
 * Drawn by the design system's own `.vdm-actionmenu` and `.vdm-menu`, but placed `fixed` from
 * where its trigger is, so a card that rounds its corners with `overflow: hidden` or a table that
 * scrolls sideways cannot cut it off. Not a popover in the top layer: the floor of
 * `.browserslistrc` has neither popovers (Firefox 125) nor anchor positioning to tie one to its
 * row. It opens below `⋯`, above it where the window has no room below, and closes when the page
 * scrolls or resizes, which would leave it behind its row.
 */

/** The gap between `⋯` and the menu, as `.vdm-menu` puts it below its trigger. */
const GAP = 6

/**
 * Where the open menu stands, in the trigger's own coordinates: the trigger's right edge, which
 * the menu's right edge meets, and the menu's top. Nothing is measured against the window, whose
 * width and height a page wider than a phone's screen would make wrong.
 */
type Place = { right: number; top: number }
export const ActionMenu = clientEntry(
  import.meta.url,
  function ActionMenu(handle: Handle<ActionMenuProps>) {
    let isOpen = false
    let announced = ''
    let root: HTMLElement | null = null
    let trigger: HTMLButtonElement | null = null
    let menu: HTMLElement | null = null
    let place: Place | null = null
    let outside: AbortController | null = null
    let menuId = `action-menu-${handle.id}`
    handle.signal.addEventListener('abort', () => outside?.abort(), { once: true })

    function close(shouldFocusTrigger: boolean): void {
      isOpen = false
      place = null
      outside?.abort()
      outside = null
      handle.update()
      if (shouldFocusTrigger) trigger?.focus()
    }

    function open(): void {
      if (trigger === null) return
      let box = trigger.getBoundingClientRect()
      isOpen = true
      place = { right: box.right, top: box.bottom + GAP }
      outside = new AbortController()
      document.addEventListener(
        'pointerdown',
        (event) => {
          if (root !== null && !root.contains(event.target as Node)) close(false)
        },
        { signal: outside.signal },
      )
      /* Captured, so a table that scrolls sideways closes it too. */
      window.addEventListener('scroll', () => close(false), {
        capture: true,
        signal: outside.signal,
      })
      window.addEventListener('resize', () => close(false), { signal: outside.signal })
      handle.update()
      /* Measured once drawn: above `⋯` only where it fits there and not below. The visible part
         of the page is the visual viewport, which a zoomed-out phone makes smaller. */
      handle.queueTask(() => {
        if (menu === null || place === null) return
        let size = menu.getBoundingClientRect().height
        let view = window.visualViewport
        let visibleTop = view?.offsetTop ?? 0
        let visibleBottom = visibleTop + (view?.height ?? window.innerHeight)
        let isShortBelow = box.bottom + GAP + size > visibleBottom
        if (isShortBelow && box.top - GAP - size >= visibleTop) {
          place = { right: place.right, top: box.top - GAP - size }
          handle.update()
        }
      })
    }

    async function copy(text: string): Promise<void> {
      /* Emptied first, so a second copy is announced again. */
      announced = ''
      handle.update()
      try {
        await navigator.clipboard.writeText(text)
        announced = COPIED_LABEL
      } catch {
        announced = ''
      }
      close(true)
    }

    function itemView(item: ActionMenuItem, index: number) {
      if ('isSeparator' in item) return <div class="vdm-menu__sep" key={index} role="separator" />
      if ('copyText' in item) {
        let text = item.copyText
        return (
          <button
            class="vdm-menu__item"
            key={index}
            mix={on('click', () => void copy(text))}
            type="button"
          >
            {item.label}
          </button>
        )
      }
      if ('action' in item) {
        return (
          <form action={item.action} key={index} method="post">
            <input name="_csrf" type="hidden" value={item.csrfToken} />
            <button class="vdm-menu__item" type="submit">
              {item.label}
            </button>
          </form>
        )
      }
      return item.isSameTab === true ? (
        <a class="vdm-menu__item" href={item.href} key={index}>
          {item.label}
        </a>
      ) : (
        <a class="vdm-menu__item" href={item.href} key={index} rel="noopener" target="_blank">
          {item.label}
          <span class="vdm-sr-only">{tied` (otevře se v nové záložce)`}</span>
        </a>
      )
    }

    return () => {
      let { items, label } = handle.props
      if (items.length === 0) return null

      return (
        <span
          class="vdm-actionmenu"
          mix={[
            on('keydown', (event) => {
              if (event.key === 'Escape' && isOpen) close(true)
            }),
            on('focusout', (event) => {
              let next = (event as FocusEvent).relatedTarget as Node | null
              if (isOpen && next !== null && root !== null && !root.contains(next)) close(false)
            }),
            ref((node) => {
              root = node as HTMLElement
            }),
          ]}
        >
          <button
            aria-controls={menuId}
            aria-expanded={isOpen ? 'true' : 'false'}
            aria-label={label}
            class="vdm-btn vdm-btn--outline vdm-btn--sm vdm-actionmenu__trigger"
            mix={[
              on('click', () => (isOpen ? close(false) : open())),
              ref((node) => {
                trigger = node as HTMLButtonElement
              }),
            ]}
            type="button"
          >
            ⋯
          </button>
          {isOpen && place !== null ? (
            <div
              class="vdm-menu vdm-menu--end"
              id={menuId}
              mix={ref((node) => {
                menu = node as HTMLElement
              })}
              style={{
                left: `${place.right}px`,
                position: 'fixed',
                right: 'auto',
                top: `${place.top}px`,
                transform: 'translateX(-100%)',
              }}
            >
              {items.map(itemView)}
            </div>
          ) : null}
          <span class="vdm-sr-only" role="status">
            {announced}
          </span>
        </span>
      )
    }
  },
)
