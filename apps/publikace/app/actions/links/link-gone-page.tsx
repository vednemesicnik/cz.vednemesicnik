import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import {
  LINK_GONE_NOTE,
  LINK_GONE_TEXT,
  LINK_GONE_TITLE,
  PREVIEW_GENERIC_TITLE,
} from '../../domain/link.ts'
import { LinkPage } from '../../ui/link-page/component.tsx'

const textStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '16px',
  lineHeight: 1.5,
  margin: 0,
})

/**
 * `02e`: one page for a replaced link, a closed issue and a key nobody issued, so the page
 * never tells which; no button and no e-mail, because the newsroom writes to the
 * editors-in-chief where the link came from.
 */
export function LinkGonePage(handle: Handle<{ imageUrl: string }>) {
  return () => (
    <LinkPage
      preview={{ imageUrl: handle.props.imageUrl, title: PREVIEW_GENERIC_TITLE }}
      title={LINK_GONE_TITLE}
    >
      <h1 class="vdm-page-title" style={{ margin: 0 }}>
        {LINK_GONE_TITLE}
      </h1>
      <p mix={textStyle}>{LINK_GONE_TEXT}</p>
      <p mix={textStyle}>{LINK_GONE_NOTE}</p>
    </LinkPage>
  )
}
