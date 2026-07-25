// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { ContentLinkCategories } from './_component'

const meta: Meta<typeof ContentLinkCategories> = {
  component: ContentLinkCategories,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/ContentLinkCategories',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    categories: [
      { name: 'Příroda', slug: 'priroda' },
      { name: 'Reportáže', slug: 'reportaze' },
    ],
  },
}
