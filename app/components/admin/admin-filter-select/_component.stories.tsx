// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { contentStateConfig } from '~/config/content-state-config'

import { AdminFilterSelect } from './_component'

const meta: Meta<typeof AdminFilterSelect> = {
  component: AdminFilterSelect,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminFilterSelect',
}

export default meta
type Story = StoryObj<typeof meta>

const stateOptions = contentStateConfig.states.map((state) => ({
  label: contentStateConfig.selectMap[state],
  value: state,
}))

/**
 * Filter off: the leading „Vše" option is selected, so the param is absent from
 * the submitted query. Outside a form the auto-submit on change is inert.
 */
export const Playground: Story = {
  args: {
    label: 'Stav',
    name: 'state',
    options: stateOptions,
  },
}

/**
 * Active filter: `defaultValue` matches the state currently in the URL.
 */
export const WithSelectedValue: Story = {
  args: {
    defaultValue: 'draft',
    label: 'Stav',
    name: 'state',
    options: stateOptions,
  },
}
