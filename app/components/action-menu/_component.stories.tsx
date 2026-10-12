// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Button } from '~/components/button'

import { ActionMenu } from './_component'

const meta: Meta<typeof ActionMenu> = {
  argTypes: {
    align: {
      control: 'inline-radio',
      options: ['start', 'end'],
    },
  },
  component: ActionMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/ActionMenu',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled). Click „⋯“ to open the menu.
 */
export const Playground: Story = {
  args: {
    align: 'end',
    items: [{ danger: true, label: 'Smazat…', onSelect: fn() }],
    label: 'Další akce s účtem',
  },
}

/**
 * In a detail's header (design 28e): „⋯“ before the one outline action. An
 * empty list renders nothing, so the header keeps only Upravit.
 */
export const InHeader: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionMenu
          items={[{ danger: true, label: 'Smazat…', onSelect: fn() }]}
          label={'Další akce s účtem'}
        />
        <Button variant={'outline'}>Upravit</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionMenu
          items={[
            { label: 'Vydat nouzový odkaz…', onSelect: fn() },
            { danger: true, label: 'Smazat…', onSelect: fn() },
          ]}
          label={'Další akce s účtem'}
        />
        <Button variant={'outline'}>Upravit</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionMenu items={[]} label={'Další akce s účtem'} />
        <Button variant={'outline'}>Upravit</Button>
      </div>
    </div>
  ),
}
