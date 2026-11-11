// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { fn } from 'storybook/test'

import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { ARTICLE_NOUN } from '~/config/list-noun-config'

import { SaveFilterDialog } from './_component'

const meta: Meta<typeof SaveFilterDialog> = {
  component: SaveFilterDialog,
  decorators: [(Story) => withRouter(<Story />)],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/SaveFilterDialog',
}

export default meta
type Story = StoryObj<typeof meta>

// `useFetcher` needs a data router, the form an authenticity token and a
// route that takes the post.
const withRouter = (children: ReactElement) => {
  const router = createMemoryRouter(
    [
      {
        action: () => null,
        element: (
          <AuthenticityTokenProvider token={'story-token'}>
            {children}
          </AuthenticityTokenProvider>
        ),
        path: '/administration/articles',
      },
      { action: () => null, path: '/administration/filters' },
    ],
    { initialEntries: ['/administration/articles'] },
  )

  return <RouterProvider router={router} />
}

/** Saving the articles list's filters, one per line (22d). */
export const Playground: Story = {
  args: {
    children: (
      <>
        {/* The look is the caller's: `SavedFiltersMenu` styles its summary. */}
        <p style={{ margin: 0 }}>Uloží se:</p>
        <ul
          style={{
            color: 'var(--text-primary)',
            listStyle: 'none',
            margin: '4px 0 0',
            padding: 0,
          }}
        >
          <li>Stav: Koncept</li>
          <li>Rubrika: Rozhovory</li>
        </ul>
      </>
    ),
    currentQuery: 'state=draft&category=rozhovory',
    defaultHint: ARTICLE_NOUN.defaultFilterHint,
    onClose: fn(),
    tableKey: 'articles',
  },
}
