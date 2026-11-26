import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import { AccountBanner, type AccountBannerProps } from '../account-banner/component.tsx'
import { JobsBanner } from '../jobs-banner/component.tsx'
import { Panel, type PanelPerson, type PanelSection } from '../panel/component.tsx'
import { MenuButton } from '../public/menu-button/component.tsx'
import { type ToastMessage, Toasts } from '../toast/component.tsx'
import { VdmLogo } from '../vdm-logo/component.tsx'

export type LayoutProps = {
  /** The panel section this page belongs to. */
  active: PanelSection
  children?: RemixNode
  /**
   * The state of the Drive account, for the banner over the page while it is not connected
   * (`14g`, `14c`). Every screen of the editors-in-chief passes it.
   */
  driveAccount: Omit<AccountBannerProps, 'isOnSettings'>
  /**
   * Takes the page out of reach while a question is asked over it, so focus and clicks stay in
   * the question: it is drawn at its own address with no script to open it as a modal.
   */
  isInert?: boolean
  /** The signed-in person; only an editor-in-chief gets the banners, which lead into Nastavení. */
  person: PanelPerson
  /** The name in the top bar on a phone: the section, or the issue on its detail. */
  title: string
  /** Messages the previous request left for this page. */
  toasts?: readonly ToastMessage[]
}

const PHONE = '@media (max-width: 767.98px)'

/*
 * The panel's 224 px is the drawing's number (`.app` in the canvas's `navrh.css`), so the
 * grid holds it. The main track may shrink under its content, so a long address wraps
 * instead of widening the page. Below 768 px the panel gives way to the top bar (`11e`).
 */
const shellStyle = css({
  display: 'grid',
  gridTemplateColumns: '224px minmax(0, 1fr)',
  minHeight: '100dvh',
  [PHONE]: { gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'auto 1fr' },
})

/* On a wrapper, never on the bar itself: `css()` lands in a cascade layer, and the design
   system's unlayered `.vdm-topbar { display: flex }` would beat it on the same element. */
const topBarStyle = css({ display: 'none', [PHONE]: { display: 'block' } })

/*
 * The panel is exactly as tall as the window and stays there while the page scrolls beside it.
 * On the wrapper, because `css()` loses to `.vdm-sidebar` on the aside itself; the aside's own
 * `min-height: 100%` then fills it.
 *
 * `sticky` rather than `fixed`, so the panel keeps its grid track and the page needs no margin
 * for it. It only sticks with `alignSelf: start`: a grid item stretches to the row, and one as
 * tall as the whole page has nowhere to slide. `100dvh` is the visible window, not the one under
 * a browser's toolbars. A window shorter than the panel scrolls the panel itself, and a flick at
 * its end stays in the panel.
 */
const sideStyle = css({
  alignSelf: 'start',
  height: '100dvh',
  overflow: 'hidden auto',
  overscrollBehavior: 'contain',
  position: 'sticky',
  top: 0,
  [PHONE]: { display: 'none' },
})

/* The page's padding and the gap between its blocks, as `.main` in the canvas's `navrh.css`
   draws them (`11e`); the room under a toast is counted from them. */
const PAGE = { bottom: 40, gap: 20, inline: 32 }
const PHONE_PAGE = { bottom: 32, gap: 16, inline: 20 }

/* The toast stands 18 px above the window's bottom edge and 18 px beside the panel, 242 px from
   the window's left edge; on a phone, with no panel, 16 px from it. */
const TOAST_OFFSET = 18
const PHONE_TOAST_INSET = 16

/* The tallest toast the app draws, three lines: a message on two and its detail line (`11f`). */
const TALLEST_TOAST = 83

const mainStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: `${PAGE.gap}px`,
  minWidth: 0,
  padding: `28px ${PAGE.inline}px ${PAGE.bottom}px`,
  [PHONE]: {
    gap: `${PHONE_PAGE.gap}px`,
    padding: `20px ${PHONE_PAGE.inline}px ${PHONE_PAGE.bottom}px`,
  },
})

/*
 * A page drawn with a toast ends with room for it until the next load, whatever the toast and
 * even once it left: the page's usual bottom padding, the toast, and its offset from the window's
 * edge (`11f`, 8oz79qvl). The toast is its own spacer, so its height is never guessed: it stands
 * last in the page, `sticky` 18 px above the window's edge, and the page's bottom padding moves
 * above it. Scrolled to the end, it is where `fixed` would have put it, with the last content
 * the usual 40 / 32 px above it.
 */
const mainWithToastStyle = css({
  paddingBottom: `${TOAST_OFFSET}px`,
  [PHONE]: { paddingBottom: `${TOAST_OFFSET}px` },
})

/*
 * The padding above the toast adds to the page's gap up to its usual bottom padding; it is
 * padding rather than margin so that the `auto` margin can take the rest of a page shorter than
 * the window, where `sticky` alone would leave the toast right under the last content instead of
 * 18 px above the window's edge. The page fills the window's height (`shellStyle`), so the slot
 * then stands at its bottom. The inline margins pull it from the page's padding to the toast's own
 * offset, and give it as much width as `fixed` did, the window less the panel and 18 px on each
 * side. `alignSelf: start` keeps it as wide as its toast. It lets taps through; a toast with an
 * action takes them back (`zulb5phd`).
 */
const toastSlotStyle = css({
  alignSelf: 'start',
  bottom: `${TOAST_OFFSET}px`,
  marginBlockStart: 'auto',
  marginInline: `${TOAST_OFFSET - PAGE.inline}px`,
  paddingBlockStart: `${PAGE.bottom - PAGE.gap}px`,
  pointerEvents: 'none',
  position: 'sticky',
  zIndex: 'var(--z-notification)',
  [PHONE]: {
    marginInline: `${PHONE_TOAST_INSET - PHONE_PAGE.inline}px`,
    paddingBlockStart: `${PHONE_PAGE.bottom - PHONE_PAGE.gap}px`,
  },
})

/* With no toast, the slot holds only the empty live regions, which must be there before a
   message is put into them; the margin takes back the gap it would add. */
const emptyToastSlotStyle = css({
  marginBlockStart: `-${PAGE.gap}px`,
  [PHONE]: { marginBlockStart: `-${PHONE_PAGE.gap}px` },
})

/* Focus scrolls clear of a toast too (WCAG 2.2, 2.4.11). `scroll-padding` cannot read the
   toast's height, so it takes the tallest toast's room, which `11f` allows: more, never less. */
const TOAST_SCROLL_PADDING =
  `html { scroll-padding-bottom: ${TALLEST_TOAST + TOAST_OFFSET + PAGE.bottom}px }` +
  ` ${PHONE} { html { scroll-padding-bottom: ${TALLEST_TOAST + TOAST_OFFSET + PHONE_PAGE.bottom}px } }`

/* The menu covers the whole screen, so the dialog's own frame, margin and size cap go. */
const menuDialogStyle = css({
  background: 'var(--bg-secondary)',
  border: 0,
  height: '100dvh',
  margin: 0,
  maxHeight: 'none',
  maxWidth: 'none',
  padding: 0,
  width: '100%',
})

/**
 * A screen of the app: the panel on the left and the page beside it, as every
 * screen from `11` on draws it. On a phone the top bar with _Menu_ stands over the page instead,
 * and _Menu_ opens the same panel over the whole screen (`11e`), the same on every screen.
 */
export function Layout(handle: Handle<LayoutProps>) {
  let menuId = `panel-menu-${handle.id}`

  return () => {
    let toasts = handle.props.toasts ?? []
    let hasToast = toasts.length > 0

    return (
      <div inert={handle.props.isInert === true ? true : undefined} mix={shellStyle}>
        <div mix={topBarStyle}>
          <header class="vdm-topbar">
            <VdmLogo size={28} />
            <span class="vdm-topbar__title">{handle.props.title}</span>
            <MenuButton controls={menuId} />
          </header>
        </div>
        <div mix={sideStyle}>
          <Panel active={handle.props.active} person={handle.props.person} />
        </div>
        <dialog aria-label="Menu" id={menuId} mix={menuDialogStyle}>
          <Panel active={handle.props.active} isMenu person={handle.props.person} />
        </dialog>
        <main mix={hasToast ? [mainStyle, mainWithToastStyle] : mainStyle}>
          {handle.props.person.isEditor ? (
            <>
              <AccountBanner
                {...handle.props.driveAccount}
                isOnSettings={handle.props.active === 'settings'}
              />
              <JobsBanner />
            </>
          ) : null}
          {handle.props.children}
          <div mix={hasToast ? toastSlotStyle : emptyToastSlotStyle}>
            {hasToast ? <style>{TOAST_SCROLL_PADDING}</style> : null}
            <Toasts messages={toasts} />
          </div>
        </main>
      </div>
    )
  }
}
