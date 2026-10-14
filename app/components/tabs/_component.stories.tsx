// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { TabsItem } from '~/components/tabs-item'

import { Tabs } from './_component'

const ARTICLES = '/administration/articles'
const CATEGORIES = '/administration/articles/categories'
const TAGS = '/administration/articles/tags'

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[parameters.path ?? ARTICLES]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/Tabs',
}

export default meta
type Story = StoryObj<typeof meta>

const items = (
  <>
    <TabsItem end={true} to={ARTICLES}>
      Články
    </TabsItem>
    <TabsItem to={CATEGORIES}>Rubriky</TabsItem>
    <TabsItem to={TAGS}>Štítky</TabsItem>
  </>
)

export const Playground: Story = {
  args: {
    children: items,
    label: 'Články',
  },
}

/** The middle tab active: the tabs around it keep their places. */
export const MiddleActive: Story = {
  args: Playground.args,
  parameters: { path: CATEGORIES },
}
