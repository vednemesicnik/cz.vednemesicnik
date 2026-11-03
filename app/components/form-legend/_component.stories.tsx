// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { FormLegend } from './_component'

const meta: Meta<typeof FormLegend> = {
  component: FormLegend,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/FormLegend',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
