// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useState } from 'react'

import { SegmentedControl } from './_component'

const colorSchemeOptions = [
  { label: 'Systém', value: 'system' },
  { label: 'Světlý', value: 'light' },
  { label: 'Tmavý', value: 'dark' },
]

// The control is controlled; the story keeps the choice so a click moves it.
const StatefulSegmentedControl = ({
  value: initialValue,
  ...rest
}: ComponentProps<typeof SegmentedControl>) => {
  const [value, setValue] = useState(initialValue)

  return (
    <SegmentedControl
      {...rest}
      onChange={(event) => setValue(event.currentTarget.value)}
      value={value}
    />
  )
}

const meta: Meta<typeof SegmentedControl> = {
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
  },
  render: (args) => <StatefulSegmentedControl {...args} />,
  tags: ['autodocs'],
  title: 'Components/SegmentedControl',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    hint: 'Vzhled se řídí nastavením zařízení.',
    legend: 'Režim',
    name: 'colorScheme',
    onChange: () => {},
    options: colorSchemeOptions,
    value: 'system',
  },
}

export const WithoutHint: Story = {
  args: {
    legend: 'Režim',
    name: 'colorScheme',
    onChange: () => {},
    options: colorSchemeOptions,
    value: 'dark',
  },
}
