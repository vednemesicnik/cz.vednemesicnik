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
  /** The signed-in editor-in-chief. */
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

const mainStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: 0,
  padding: '28px 32px 40px',
  [PHONE]: { padding: '20px 20px 32px', gap: '16px' },
})

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
 * The screen of the editors-in-chief: the panel on the left and the page beside it, as every
 * screen from `11` on draws it. On a phone the top bar with _Menu_ stands over the page instead,
 * and _Menu_ opens the same panel over the whole screen (`11e`), the same on every screen.
 */
export function Layout(handle: Handle<LayoutProps>) {
  let menuId = `panel-menu-${handle.id}`

  return () => (
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
      <main mix={mainStyle}>
        <AccountBanner
          {...handle.props.driveAccount}
          isOnSettings={handle.props.active === 'settings'}
        />
        <JobsBanner />
        {handle.props.children}
      </main>
      <Toasts messages={handle.props.toasts ?? []} />
    </div>
  )
}
