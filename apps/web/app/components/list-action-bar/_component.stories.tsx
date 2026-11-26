// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '~/components/button'

import { ListActionBar } from './_component'

const meta: Meta<typeof ListActionBar> = {
  component: ListActionBar,
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/ListActionBar',
}

export default meta
type Story = StoryObj<typeof meta>

/** The list's main action at the bottom of a phone's screen; nothing from 768 px (22g). */
export const Playground: Story = {
  render: () => (
    <ListActionBar>
      <Button type={'button'}>Nová rubrika</Button>
    </ListActionBar>
  ),
}
