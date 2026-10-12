// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '~/components/button'

import { AdminSignInCard } from './_component'

const meta: Meta<typeof AdminSignInCard> = {
  component: AdminSignInCard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminSignInCard',
}

export default meta
type Story = StoryObj<typeof meta>

const text = {
  color: 'var(--text-secondary)',
  fontSize: '14px',
  lineHeight: 1.55,
  margin: 0,
  textAlign: 'center',
} as const

/**
 * Interactive base case (controls enabled): a card with its text and button,
 * as the confirmation of the emergency link (design 20f).
 */
export const Playground: Story = {
  args: {
    children: (
      <>
        <Button style={{ width: '100%' }}>Přihlásit se</Button>
        <p style={text}>Po přihlášení si můžete v Nastavení přidat passkey.</p>
      </>
    ),
    details: (
      <p style={text}>
        Účet: <strong>jakub.novak@vednemesicnik.cz</strong>
      </p>
    ),
    title: 'Potvrďte přihlášení',
  },
}

/**
 * A title and a sentence only (20f, a link that no longer works).
 */
export const TextOnly: Story = {
  args: {
    children: (
      <p style={text}>
        Přihlaste se jinak nebo se obraťte na Administrátora či Vlastníka —
        tento nouzový odkaz už neplatí.
      </p>
    ),
    title: 'Odkaz už neplatí',
  },
}

/**
 * Under 768 px there is no card: the content stands on the white page (20e).
 */
export const Phone: Story = {
  args: Playground.args,
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
}
