// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { fn } from 'storybook/test'

import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { ISSUE_BULK_NOUN } from '~/config/bulk-noun-config'

import type { SelectedContent } from './_component'
import { ContentSelectionBar } from './_component'

const meta: Meta<typeof ContentSelectionBar> = {
  component: ContentSelectionBar,
  decorators: [(Story) => withRouter(<Story />)],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/ContentSelectionBar',
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
        path: '/administration/archive',
      },
    ],
    { initialEntries: ['/administration/archive'] },
  )

  return <RouterProvider router={router} />
}

const issue = (
  id: string,
  title: string,
  overrides: Partial<SelectedContent> = {},
): SelectedContent => ({
  bulkActions: ['retract', 'archive'],
  id,
  isHeldByOther: false,
  isIncomplete: false,
  isNotSubmitted: false,
  state: 'published',
  title,
  ...overrides,
})

/** Three published issues: retract or archive them all (26f). */
export const Playground: Story = {
  args: {
    action: '/administration/archive',
    fetcherKey: 'archive-bulk-action',
    isCreator: false,
    noun: ISSUE_BULK_NOUN,
    onClear: fn(),
    records: [
      issue('a', 'červen 2026'),
      issue('b', 'červen 2026 – Maturitní ples'),
      issue('c', 'březen 2026'),
    ],
  },
}

/** Two incomplete drafts: publishing is not offered, deleting is (26f). */
export const IncompleteDrafts: Story = {
  args: {
    ...Playground.args,
    records: [
      issue('a', 'zima 2026', {
        bulkActions: ['publish', 'delete'],
        isIncomplete: true,
        state: 'draft',
      }),
      issue('b', 'jaro 2026', {
        bulkActions: ['publish', 'delete'],
        isIncomplete: true,
        state: 'draft',
      }),
    ],
  },
}

/** Every selected issue is being edited: the bar says so (22c). */
export const AllHeld: Story = {
  args: {
    ...Playground.args,
    records: [
      issue('a', 'červen 2026', { isHeldByOther: true }),
      issue('b', 'březen 2026', { isHeldByOther: true }),
    ],
  },
}
