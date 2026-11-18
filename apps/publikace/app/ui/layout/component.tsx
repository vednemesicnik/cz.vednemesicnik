import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import { AccountBanner, type AccountBannerProps } from '../account-banner/component.tsx'
import { Panel, type PanelPerson, type PanelSection } from '../panel/component.tsx'
import { Toasts } from '../toast/component.tsx'

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
  /** Messages the previous request left for this page. */
  toasts?: readonly string[]
}

/*
 * The panel's 224 px is the drawing's number (`.app` in the canvas's `navrh.css`), so the
 * grid holds it. The main track may shrink under its content, so a long address wraps
 * instead of widening the page.
 */
const shellStyle = css({
  display: 'grid',
  gridTemplateColumns: '224px minmax(0, 1fr)',
  minHeight: '100dvh',
})

const mainStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: 0,
  padding: '28px 32px 40px',
})

/**
 * The screen of the editors-in-chief: the panel on the left and the page beside it, as every
 * screen from `11` on draws it. Below 768 px the panel folds into a top bar (`11e`), which
 * arrives with the first screen that is used on a phone.
 */
export function Layout(handle: Handle<LayoutProps>) {
  return () => (
    <div inert={handle.props.isInert === true ? true : undefined} mix={shellStyle}>
      <Panel active={handle.props.active} person={handle.props.person} />
      <main mix={mainStyle}>
        <AccountBanner
          {...handle.props.driveAccount}
          isOnSettings={handle.props.active === 'settings'}
        />
        {handle.props.children}
      </main>
      <Toasts messages={handle.props.toasts ?? []} />
    </div>
  )
}
