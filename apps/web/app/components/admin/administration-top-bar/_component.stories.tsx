// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdministrationTopBarTitle } from '../administration-top-bar-title'
import { AdministrationTopBar } from './_component'

const meta: Meta<typeof AdministrationTopBar> = {
  argTypes: {
    children: { control: false },
  },
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
    children: <AdministrationTopBarTitle>Články</AdministrationTopBarTitle>,
    expanded: false,
  },
}

// Where the sidebar highlights nothing (30e, 30h): only the logo and Menu (22j).
export const WithoutTitle: Story = {
  args: {
    expanded: false,
  },
}
