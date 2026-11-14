import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import { Panel, type PanelSection } from '../panel/component.tsx'

export type LayoutProps = {
  /** The panel section this page belongs to. */
  active: PanelSection
  children?: RemixNode
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
    <div mix={shellStyle}>
      <Panel active={handle.props.active} />
      <main mix={mainStyle}>{handle.props.children}</main>
    </div>
  )
}
