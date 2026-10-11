// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdministrationTopBar } from './_component'

const meta: Meta<typeof AdministrationTopBar> = {
  component: AdministrationTopBar,
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Administration/AdministrationTopBar',
}

export default meta
type Story = StoryObj<typeof meta>

// The bar on the article list below 768 px: the page's name is the active
// sidebar item (22g, tbi5qpq9).
export const Playground: Story = {
  args: {
    expanded: false,
    menuLabel: 'Menu',
    title: 'Články',
  },
}

// Where the sidebar highlights nothing (30e, 30h): only the logo and Menu (22j).
export const WithoutTitle: Story = {
  args: {
    expanded: false,
  },
}
