// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { AdminHeadline } from '~/components/admin/admin-headline'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'

import { ListHeader } from './_component'

const meta: Meta<typeof ListHeader> = {
  component: ListHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ inlineSize: 'min(720px, 90vw)' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/ListHeader',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled).
 */
export const Playground: Story = {
  args: {
    action: (
      <LinkButton to={'/administration/podcasts/add-podcast'}>
        Nový podcast
      </LinkButton>
    ),
    children: <AdminHeadline>Podcasty</AdminHeadline>,
  },
}

/**
 * The article list: the waiting work under the headline (22a).
 */
export const WithWaitingWork: Story = {
  args: {
    action: (
      <LinkButton to={'/administration/articles/add-article'}>
        Nový článek
      </LinkButton>
    ),
    children: (
      <>
        <AdminHeadline>Články</AdminHeadline>
        <p style={{ margin: 0 }}>
          <Link to={{ search: '?state=pending' }}>
            Na schválení čekají 3 články
          </Link>
        </p>
      </>
    ),
  },
}
