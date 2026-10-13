// noinspection JSUnusedGlobalSymbols

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { AdminActionGroup } from '~/components/admin/admin-action-group'
import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { ToastProvider } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'

import { AdminSubmissionActions } from './_component'

// useFetcher requires a data router; the token provider satisfies the CSRF
// input. The action answers like the content pages do, so the toast shows.
const withDataRouter: Decorator = (Story) => {
  const router = createMemoryRouter(
    [
      {
        action: async ({ request }) => {
          const formData = await request.formData()
          return { intent: formData.get(FORM_CONFIG.intent.name), missing: [] }
        },
        Component: () => (
          <AuthenticityTokenProvider token={'storybook-csrf-token'}>
            <ToastProvider>
              <AdminActionGroup>
                <Story />
              </AdminActionGroup>
            </ToastProvider>
          </AuthenticityTokenProvider>
        ),
        path: '*',
      },
    ],
    { initialEntries: ['/'] },
  )

  return <RouterProvider router={router} />
}

const meta: Meta<typeof AdminSubmissionActions> = {
  component: AdminSubmissionActions,
  decorators: [withDataRouter],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminSubmissionActions',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    canReturn: false,
    canSubmit: true,
    canWithdraw: false,
    contentId: 'content-1',
  },
}

/** The author's own draft, before it is sent. */
export const AuthorDraft: Story = {
  args: { ...Playground.args, canSubmit: true },
}

/** The author's submitted draft: only taking it back is left. */
export const AuthorSubmitted: Story = {
  args: { ...Playground.args, canSubmit: false, canWithdraw: true },
}

/** The Coordinator on a submitted draft. */
export const CoordinatorSubmitted: Story = {
  args: { ...Playground.args, canReturn: true, canSubmit: false },
}
