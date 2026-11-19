import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'
import { ImportMap } from 'remix/component/server'

import { scriptEntry, stylesheetHref } from '../assets.ts'

export type DocumentProps = {
  children?: RemixNode
  head?: RemixNode
  /** The page's own name; the app's name follows it. */
  title?: string
}

const APP_NAME = 'Publikace'

/*
 * The design system sets the colours and the face on its tokens but leaves `body` alone, so
 * the page ground and the type are said here once. The smoothing is the one the design canvas
 * draws with: on macOS the default renders Inter a step heavier than the drawings.
 */
const bodyStyle = css({
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family)',
  margin: 0,
  MozOsxFontSmoothing: 'grayscale',
  WebkitFontSmoothing: 'antialiased',
})

/**
 * The HTML shell of every page.
 *
 * The magazine's design system is the one stylesheet, from the copy in `app/ui/public/ds/`,
 * fonts included, so the page makes no request outside the app.
 */
export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, head, title } = handle.props
    let { href, importMap, preloads } = scriptEntry

    return (
      <html lang="cs">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <title>{title === undefined ? APP_NAME : `${title} · ${APP_NAME}`}</title>
          <link rel="stylesheet" href={stylesheetHref} />
          {head}
          <ImportMap value={importMap} />
          {preloads.map((preloadHref) => (
            <link key={preloadHref} rel="modulepreload" href={preloadHref} />
          ))}
          <script type="module" src={href}></script>
        </head>
        <body mix={bodyStyle}>{children}</body>
      </html>
    )
  }
}
