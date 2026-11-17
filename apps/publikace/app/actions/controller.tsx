import { createController } from 'remix/router'

import type { SignedInUntilCookie } from '../auth/session.server.ts'
import { requireEditor } from '../middleware/auth.server.ts'
import { Toasts } from '../middleware/toasts.server.ts'
import { routes } from '../routes.ts'
import { Layout } from '../ui/layout/component.tsx'
import { Document } from './document.tsx'

export default function createHomeController(signedInUntil: SignedInUntilCookie) {
  return createController(routes, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      /*
       * The overview of issues (`11a`) will stand here. Until it does, the page is the layout
       * with its heading, so the panel and the design system can be seen working.
       */
      home(context) {
        return context.render(
          <Document title="Vydání">
            <Layout active="issues" person={context.auth.identity} toasts={context.get(Toasts)}>
              <h1 class="vdm-page-title">Vydání</h1>
            </Layout>
          </Document>,
        )
      },
    },
  })
}
