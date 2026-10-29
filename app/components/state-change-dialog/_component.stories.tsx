// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { fn } from 'storybook/test'

import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { DialogBody } from '~/components/dialog-body'

import { StateChangeDialog } from './_component'

const meta: Meta<typeof StateChangeDialog> = {
  component: StateChangeDialog,
  decorators: [(Story) => withRouter(<Story />)],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/StateChangeDialog',
}

export default meta
type Story = StoryObj<typeof meta>

// `useFetcher` needs a data router, the form an authenticity token.
const withRouter = (children: ReactElement) => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthenticityTokenProvider token={'story-token'}>
            {children}
          </AuthenticityTokenProvider>
        ),
        path: '/administration/articles',
      },
    ],
    { initialEntries: ['/administration/articles'] },
  )

  return <RouterProvider router={router} />
}

/** Archiving one article: the record under the title (23e). */
export const Playground: Story = {
  args: {
    action: '/administration/articles/article-id',
    children: (
      <>
        <AdminModalTitle>Archivovat článek?</AdminModalTitle>
        <AdminModalSubject>
          Deset knih na podzim, které nejsou v osnovách
        </AdminModalSubject>
        <DialogBody>
          <AdminModalDescription>
            Čtenáři článek na webu neuvidí. V administraci zůstane mezi
            archivovanými.
          </AdminModalDescription>
        </DialogBody>
      </>
    ),
    confirmLabel: 'Archivovat článek',
    fetcherKey: 'story-state-change',
    intent: 'archive',
    onClose: fn(),
  },
}

/** A category whose name is in the question, so no record line (25d). */
export const WithoutSubject: Story = {
  args: {
    ...Playground.args,
    children: (
      <>
        <AdminModalTitle>
          Stáhnout rubriku „Rozhovory“ z publikace?
        </AdminModalTitle>
        <AdminModalDescription>
          Rubrika zmizí z webu a u publikovaných článků (3) se přestane
          zobrazovat. Vrátí se do konceptu, takže ji půjde upravit a publikovat
          znovu.
        </AdminModalDescription>
      </>
    ),
    confirmLabel: 'Stáhnout z publikace',
    intent: 'retract',
  },
}
