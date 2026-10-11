// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Toast } from './_component'

const meta: Meta<typeof Toast> = {
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'error'],
    },
  },
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/Toast',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled).
 */
export const Playground: Story = {
  args: {
    children: 'Všechna ostatní přihlášení jsou ukončena.',
    tone: 'neutral',
  },
}

/**
 * Both tones side by side (design system, Feedback card).
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      <Toast>Publikováno: 3 články</Toast>
      <Toast tone={'error'}>Obrázek se nepodařilo nahrát.</Toast>
    </div>
  ),
}
