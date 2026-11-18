import type { Handle } from 'remix/component'
import { clientEntry, on, ref } from 'remix/component'

export type ActionMenuItem = {
  href: string
  /** An item that stays in the app, like _Vydat nový odkaz…_; the rest open a new tab. */
  isSameTab?: boolean
  label: string
}

export type ActionMenuProps = {
  /** Names the trigger, which shows only `⋯`: _Další akce VDM_2026_5_. */
  label: string
  items: readonly ActionMenuItem[]
}

/**
 * The design system's `ActionMenu` on a row (`11a`): `⋯` opens a short list of shortcuts below
 * it. Its items are links, most of them to other places, so it is a list that `Tab` walks rather than an
 * arrow-key menu, and it carries no `menu` roles. A click elsewhere or Escape closes it, Escape
 * returning focus to `⋯`.
 *
 * Positioned by the design system's own `.vdm-actionmenu` and `.vdm-menu`, below its trigger,
 * rather than as a popover in the top layer: the floor of `.browserslistrc` has no anchor
 * positioning to tie one to its row.
 */
export const ActionMenu = clientEntry(
  import.meta.url,
  function ActionMenu(handle: Handle<ActionMenuProps>) {
    let isOpen = false
    let root: HTMLElement | null = null
    let trigger: HTMLButtonElement | null = null
    let outside: AbortController | null = null
    let menuId = `action-menu-${handle.id}`
    handle.signal.addEventListener('abort', () => outside?.abort(), { once: true })

    function close(shouldFocusTrigger: boolean): void {
      isOpen = false
      outside?.abort()
      outside = null
      handle.update()
      if (shouldFocusTrigger) trigger?.focus()
    }

    function open(): void {
      isOpen = true
      outside = new AbortController()
      document.addEventListener(
        'pointerdown',
        (event) => {
          if (root !== null && !root.contains(event.target as Node)) close(false)
        },
        { signal: outside.signal },
      )
      handle.update()
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
          {isOpen ? (
            <div class="vdm-menu vdm-menu--end" id={menuId}>
              {items.map((item) =>
                item.isSameTab === true ? (
                  <a class="vdm-menu__item" href={item.href}>
                    {item.label}
                  </a>
                ) : (
                  <a class="vdm-menu__item" href={item.href} rel="noopener" target="_blank">
                    {item.label}
                    <span class="vdm-sr-only"> (otevře se v nové záložce)</span>
                  </a>
                ),
              )}
            </div>
          ) : null}
        </span>
      )
    }
  },
)
