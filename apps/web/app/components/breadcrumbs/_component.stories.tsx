// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { BreadcrumbsItem } from '~/components/breadcrumbs-item'

import { Breadcrumbs } from './_component'

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
  // On the record's page, so its step is the current one.
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/administration/articles/1']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Administration/Breadcrumbs',
}

export default meta
type Story = StoryObj<typeof meta>

// Above a record's title (design 23a): its section, then the record.
export const Playground: Story = {
  args: {
    children: (
      <>
        <BreadcrumbsItem to={'/administration/articles'}>
          Články
        </BreadcrumbsItem>
        <BreadcrumbsItem to={'/administration/articles/1'}>
          Rozhovor s ředitelkou o nové budově
        </BreadcrumbsItem>
      </>
    ),
  },
}
