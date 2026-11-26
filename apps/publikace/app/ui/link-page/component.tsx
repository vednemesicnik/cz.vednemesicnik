import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

import { Document } from '../../actions/document.tsx'
import { VdmLogo } from '../vdm-logo/component.tsx'

/** What a messenger shows under the link (`02c`). An invalid key gets a title alone. */
export type LinkPreview = {
  description?: string
  /** Absolute, as a messenger fetches it from outside. */
  imageUrl: string
  title: string
}

export type LinkPageProps = {
  children?: RemixNode
  preview: LinkPreview
  /** The tab's name; the app's name follows it. */
  title: string
}

/*
 * One column of at most 600 px on every width (`20a`). From 768 px it stands as a card in the
 * middle of the secondary ground, like the sign-in (`10a`); below, the frame goes and the column
 * starts at the top, because the page opens in a messenger's browser on a phone.
 */
const pageStyle = css({
  background: 'var(--bg-primary)',
  boxSizing: 'border-box',
  minHeight: '100dvh',
  '@media (min-width: 768px)': {
    alignItems: 'flex-start',
    background: 'var(--bg-secondary)',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 24px',
  },
})

const cardStyle = css({
  boxSizing: 'border-box',
  maxWidth: '600px',
  width: '100%',
  '@media (min-width: 768px)': {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
  },
})

const brandStyle = css({
  alignItems: 'center',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  gap: '10px',
  padding: '16px 20px 12px',
  '& b': { display: 'block', fontSize: '14px', fontWeight: 600, lineHeight: 1.2 },
  '& small': {
    color: 'var(--text-secondary)',
    display: 'block',
    fontSize: '12px',
    lineHeight: 1.2,
  },
  '@media (min-width: 768px)': { padding: '20px 32px 14px' },
})

const bodyStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  padding: '20px 20px 32px',
  '@media (min-width: 768px)': { padding: '28px 32px 32px' },
})

/**
 * The frame of every page behind a shared link: the magazine's mark and the app's name, then the
 * column. Its head says `noindex` and carries the Open Graph card a messenger draws (`02a`, `02c`).
 */
export function LinkPage(handle: Handle<LinkPageProps>) {
  return () => {
    let { children, preview, title } = handle.props

    return (
      <Document
        head={
          <>
            <meta content="noindex, nofollow" name="robots" />
            <meta content="Vedneměsíčník · Publikace" property="og:site_name" />
            <meta content={preview.title} property="og:title" />
            {preview.description === undefined ? null : (
              <meta content={preview.description} property="og:description" />
            )}
            <meta content={preview.imageUrl} property="og:image" />
            <meta content="website" property="og:type" />
          </>
        }
        title={title}
      >
        <div mix={pageStyle}>
          <main mix={cardStyle}>
            <div mix={brandStyle}>
              <VdmLogo size={28} />
              <span>
                <b>Vedneměsíčník</b>
                <small>Publikace</small>
              </span>
            </div>
            <div mix={bodyStyle}>{children}</div>
          </main>
        </div>
      </Document>
    )
  }
}
