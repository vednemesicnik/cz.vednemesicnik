// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { PageTitle } from './_component'

const meta: Meta<typeof PageTitle> = {
  component: PageTitle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/PageTitle',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled).
 */
export const Playground: Story = {
  args: {
    children: 'Články',
  },
}

/**
 * A long record title wraps evenly (23a).
 */
export const LongTitle: Story = {
  args: {
    children: 'Deset knih na podzim, které nejsou v osnovách',
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 'min(360px, 90vw)' }}>
        <Story />
      </div>
    ),
  ],
}
