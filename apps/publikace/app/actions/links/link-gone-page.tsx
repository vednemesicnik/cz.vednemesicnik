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

/** The page's three sentences: the article link's (`02e`) unless the artworks' (`02f`) are given. */
export type LinkGoneWords = { note: string; text: string; title: string }

const ARTICLE_LINK_GONE: LinkGoneWords = {
  note: LINK_GONE_NOTE,
  text: LINK_GONE_TEXT,
  title: LINK_GONE_TITLE,
}

/**
 * `02e`, `02f`: one page for a replaced link, a closed issue and a key nobody issued, so the page
 * never tells which; no button and no e-mail, because the newsroom writes to the
 * editors-in-chief where the link came from.
 */
export function LinkGonePage(handle: Handle<{ imageUrl: string; words?: LinkGoneWords }>) {
  return () => {
    let words = handle.props.words ?? ARTICLE_LINK_GONE
    return (
      <LinkPage
        preview={{ imageUrl: handle.props.imageUrl, title: PREVIEW_GENERIC_TITLE }}
        title={words.title}
      >
        <h1 class="vdm-page-title" style={{ margin: 0 }}>
          {words.title}
        </h1>
        <p mix={textStyle}>{words.text}</p>
        <p mix={textStyle}>{words.note}</p>
      </LinkPage>
    )
  }
}
