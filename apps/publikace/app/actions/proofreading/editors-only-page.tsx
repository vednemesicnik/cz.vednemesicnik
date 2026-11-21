import type { Handle } from 'remix/component'
import type { RequestContext } from 'remix/router'

import { EDITORS_ONLY_TITLE, TO_PROOFREADING_LABEL } from '../../domain/proofreading-queue.ts'
import type { Person } from '../../middleware/auth.server.ts'
import { Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import { EmptyState } from '../../ui/empty-state/component.tsx'
import { EmptyStateTitle } from '../../ui/empty-state-title/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import type { DriveStatus } from '../issues/overview-page.tsx'
import { driveView, type PageContext } from '../issues/render.tsx'

type EditorsOnlyPageProps = {
  driveAccount: { expectedEmail: string; status: DriveStatus }
  person: PanelPerson
  toasts?: readonly ToastMessage[]
}

/**
 * `10d`: a screen of the editors-in-chief, opened by a proofreader who is not one of them, from a
 * link a colleague sent or a tab left open. It is refused in place rather than redirected, so they
 * learn why and where their work is. No page title and no active section: nothing here is theirs.
 * The heading and the button stand with no sentence between them (`tlb36tk0`), the button 12 px
 * under the heading as after an empty state's sentence.
 */
function EditorsOnlyPage(handle: Handle<EditorsOnlyPageProps>) {
  return () => {
    let { driveAccount, person, toasts } = handle.props

    return (
      <Document title={EDITORS_ONLY_TITLE}>
        <Layout active={null} driveAccount={driveAccount} person={person} title="" toasts={toasts}>
          <EmptyState>
            <EmptyStateTitle>{EDITORS_ONLY_TITLE}</EmptyStateTitle>
            <a
              class="vdm-btn vdm-btn--primary vdm-btn--sm"
              href={routes.proofreading.index.href()}
              style={{ marginTop: '4px' }}
            >
              {TO_PROOFREADING_LABEL}
            </a>
          </EmptyState>
        </Layout>
      </Document>
    )
  }
}

/** The answer `requireEditor()` gives a signed-in person who is not an editor-in-chief: 403. */
export async function renderEditorsOnly(
  context: RequestContext,
  person: Person | null,
): Promise<Response> {
  if (person === null) return new Response('Forbidden', { status: 403 })
  let page = context as unknown as PageContext
  return page.render(
    <EditorsOnlyPage
      driveAccount={await driveView(page)}
      person={person}
      toasts={page.get(Toasts) as readonly ToastMessage[]}
    />,
    { status: 403 },
  )
}
