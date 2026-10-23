// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { VisuallyHidden } from './_component'

const meta: Meta<typeof VisuallyHidden> = {
  component: VisuallyHidden,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/VisuallyHidden',
}

export default meta
type Story = StoryObj<typeof meta>

/** The hidden part is read with the header, so the canvas shows only „Publikováno“. */
export const Playground: Story = {
  args: {
    children: ' (Publikované články, epizody a čísla)',
  },
  render: (args) => (
    <span>
      Publikováno
      <VisuallyHidden {...args} />
    </span>
  ),
}
