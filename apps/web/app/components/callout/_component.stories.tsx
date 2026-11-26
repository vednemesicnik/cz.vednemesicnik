// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Hyperlink } from '~/components/hyperlink'

import { Callout } from './_component'

const meta: Meta<typeof Callout> = {
  argTypes: {
    tone: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
  component: Callout,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/Callout',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children:
      'K přihlášení e-mailem bude sloužit nová adresa. Na původní adresu přijde oznámení o změně.',
    tone: 'warning',
  },
}

/**
 * All four tones (rmridl1f): warning and error lead with an icon, info and
 * success have none.
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Callout>
        Starší články si můžete přečíst na platformě{' '}
        <Hyperlink href={'https://medium.com/vednemesicnik'}>Medium</Hyperlink>.
      </Callout>
      <Callout tone={'success'}>
        Pozvánka odešla na jakub.novak@vednemesicnik.cz.
      </Callout>
      <Callout tone={'warning'}>
        K přihlášení e-mailem bude sloužit nová adresa. Na původní adresu přijde
        oznámení o změně.
      </Callout>
      <Callout role={'alert'} tone={'error'}>
        Zkuste se přihlásit znovu — passkey se nepodařilo ověřit.
      </Callout>
    </div>
  ),
}

/** Two lines under one icon, as the version conflict in 28f. */
export const TwoLines: Story = {
  args: {
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span>
          Zkontrolujte uživatelskou roli a uložte ji znovu — mezitím se změnila.
        </span>
        <span>Změna: Petr Dvořák · 25. 9. 2026, 14:05</span>
      </div>
    ),
    tone: 'error',
  },
}
