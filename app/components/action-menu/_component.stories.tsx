// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { ActionMenuItem } from '~/components/action-menu-item'
import { Button } from '~/components/button'

import { ActionMenu } from './_component'

const meta: Meta<typeof ActionMenu> = {
  argTypes: {
    align: {
      control: 'inline-radio',
      options: ['start', 'end'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
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
    children: (
      <ActionMenuItem danger={true} onSelect={fn()}>
        Smazat…
      </ActionMenuItem>
    ),
    label: 'Další akce s účtem',
  },
}

/**
 * In a detail's header (design 28e): „⋯“ before the one outline action. A
 * menu without items hides itself, so the header keeps only Upravit.
 */
export const InHeader: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionMenu label={'Další akce s účtem'}>
          <ActionMenuItem danger={true} onSelect={fn()}>
            Smazat…
          </ActionMenuItem>
        </ActionMenu>
        <Button variant={'outline'}>Upravit</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionMenu label={'Další akce s účtem'}>
          <ActionMenuItem onSelect={fn()}>Vydat nouzový odkaz…</ActionMenuItem>
          <ActionMenuItem danger={true} onSelect={fn()}>
            Smazat…
          </ActionMenuItem>
        </ActionMenu>
        <Button variant={'outline'}>Upravit</Button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* A role that may do nothing: no items. */}
        <ActionMenu label={'Další akce s účtem'}>{[]}</ActionMenu>
        <Button variant={'outline'}>Upravit</Button>
      </div>
    </div>
  ),
}

/**
 * In a list row (design 22a): the row's one action and „⋯“ beside it, both sm.
 */
export const InRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: '6px' }}>
      <Button size={'sm'} variant={'outline'}>
        Schválit
      </Button>
      <ActionMenu size={'sm'}>
        <ActionMenuItem onSelect={fn()}>Schválit a publikovat…</ActionMenuItem>
        <ActionMenuItem onSelect={fn()}>Vrátit k úpravám</ActionMenuItem>
        <ActionMenuItem onSelect={fn()}>Upravit</ActionMenuItem>
      </ActionMenu>
    </div>
  ),
}
