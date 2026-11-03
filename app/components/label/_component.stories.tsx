import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from './_component'

const meta: Meta<typeof Label> = {
  argTypes: {
    children: {
      control: 'text',
      description: 'Label text content',
    },
    htmlFor: {
      control: 'text',
      description: 'ID of the form element this label is for',
    },
    optional: {
      control: 'boolean',
      description: 'Whether to show „(nepovinné)“ after the label',
    },
    required: {
      control: 'boolean',
      description: 'Whether to show required indicator (*)',
    },
  },
  component: Label,
  tags: ['autodocs'],
  title: 'Primitives/Label',
}

export default meta
type Story = StoryObj<typeof Label>

/**
 * Default label for form fields.
 * Associates with a form control via htmlFor attribute.
 */
export const Default: Story = {
  args: {
    children: 'Username',
    htmlFor: 'username',
  },
}

/**
 * Required field label with an asterisk in the label's own colour and weight:
 * nothing is wrong yet, so it isn't the error colour.
 */
export const Required: Story = {
  args: {
    children: 'Email Address',
    htmlFor: 'email',
    required: true,
  },
}

/**
 * Optional field label: „(nepovinné)“ in regular weight and the tertiary colour.
 */
export const Optional: Story = {
  args: {
    children: 'Phone',
    htmlFor: 'phone',
    optional: true,
  },
}

/**
 * Label with longer text content.
 * Shows how the component handles multi-word labels.
 */
export const LongText: Story = {
  args: {
    children: 'What is your preferred contact method?',
    htmlFor: 'contact-method',
  },
}

/**
 * Required label with longer text.
 * Combines required indicator with verbose label text.
 */
export const RequiredLongText: Story = {
  args: {
    children: 'Please describe your issue in detail',
    htmlFor: 'description',
    required: true,
  },
}
