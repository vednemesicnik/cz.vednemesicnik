// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'

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
 * The title, then the list's main action.
 */
export const Playground: Story = {
  args: {
    children: (
      <>
        <PageTitle>Uživatelé</PageTitle>
        <LinkButton to={'/administration/users/new'}>Nový uživatel</LinkButton>
      </>
    ),
  },
}

/**
 * A role that may not create: the title alone, at the same height.
 */
export const WithoutAction: Story = {
  args: {
    children: <PageTitle>Autoři</PageTitle>,
  },
}
