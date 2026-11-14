import { createController } from 'remix/router'

import { routes } from '../routes.ts'
import { Layout } from '../ui/layout/component.tsx'
import { Document } from './document.tsx'

export default createController(routes, {
  actions: {
    /*
     * The overview of issues (`11a`) will stand here. Until it does, the page is the layout
     * with its heading, so the panel and the design system can be seen working.
     */
    home(context) {
      return context.render(
        <Document title="Vydání">
          <Layout active="issues">
            <h1 class="vdm-page-title">Vydání</h1>
          </Layout>
        </Document>,
      )
    },
  },
})
