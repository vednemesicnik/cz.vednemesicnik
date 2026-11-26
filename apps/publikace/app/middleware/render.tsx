import { render as renderComponent } from 'remix/middleware/render'

import type { Assets } from '../assets.ts'

/**
 * `context.render` for every route: a Remix component answered as an HTML document.
 *
 * The asset server is what this has to supply. Handed it, the renderer turns a client
 * entry's `import.meta.url` into a browser module URL and writes the graph behind it into the
 * head as `modulepreload`, so the browser asks for the graph in one fan-out.
 */
export function render(assets: Assets) {
  return renderComponent({ assets: assets.server })
}
