// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminSignInText } from './_component'

const meta: Meta<typeof AdminSignInText> = {
  component: AdminSignInText,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminSignInText',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): the card's sentence (20d).
 */
export const Playground: Story = {
  args: {
    children: 'Pro případ, že nefunguje Google, passkey ani odkaz v e-mailu.',
    variant: 'text',
  },
}

/**
 * The three variants as they stand in the sign-in cards (20b, 20c, 20f).
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '336px',
      }}
    >
      <AdminSignInText>
        Pokud k adrese jakub.novak@vednemesicnik.cz patří účet, odkaz byl
        odeslán. Platí 15 minut.
      </AdminSignInText>
      <AdminSignInText variant={'note'}>
        Po přihlášení si můžete v Nastavení přidat passkey.
      </AdminSignInText>
      <AdminSignInText variant={'quiet'}>
        Nežádali jste o přihlášení? Stránku zavřete.
      </AdminSignInText>
    </div>
  ),
}
