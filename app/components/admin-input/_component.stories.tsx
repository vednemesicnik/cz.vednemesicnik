import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminInput } from './_component'

const meta: Meta<typeof AdminInput> = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    errors: {
      control: 'object',
      description:
        'Array of error messages to display. When present, input shows error styling with red border and focus shadow.',
    },
    label: {
      control: 'text',
      description: 'Label text for the input field',
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required (shows asterisk in label)',
    },
    type: {
      control: 'select',
      description: 'HTML input type attribute',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
  component: AdminInput,
  parameters: {
    docs: {
      description: {
        component:
          'Modern input field component with label, error messages, and comprehensive state management. Features smooth transitions, hover effects, and focus-visible box-shadow for keyboard navigation (Tab key). Uses form design tokens for consistent styling.',
      },
    },
  },
  tags: ['autodocs'],
  title: 'Primitives/Input',
}

export default meta
type Story = StoryObj<typeof AdminInput>

/**
 * Default text input field with label.
 * The most common input variant for general text entry.
 */
export const Default: Story = {
  args: {
    id: 'username',
    label: 'Username',
    placeholder: 'Enter your username',
  },
}

/**
 * Required input field indicated with an asterisk (*).
 * Use for mandatory form fields.
 */
export const Required: Story = {
  args: {
    id: 'email',
    label: 'Email Address',
    placeholder: 'user@example.com',
    required: true,
    type: 'email',
  },
}

/**
 * Input field with error messages displayed below.
 * Shows validation errors to the user.
 */
export const WithErrors: Story = {
  args: {
    errors: [
      'Password must be at least 8 characters',
      'Password must contain at least one number',
    ],
    id: 'password',
    label: 'Password',
    type: 'password',
  },
}

/**
 * Disabled input field prevents user interaction.
 * The field appears visually muted and cannot be edited.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    id: 'account-id',
    label: 'Account ID',
    value: '12345',
  },
}

/**
 * Email input with appropriate input type.
 * Provides email validation and mobile keyboard optimization.
 */
export const EmailInput: Story = {
  args: {
    id: 'email-field',
    label: 'Email',
    placeholder: 'name@example.com',
    type: 'email',
  },
}

/**
 * Password input with obscured text.
 * Characters are hidden for security.
 */
export const PasswordInput: Story = {
  args: {
    id: 'password-field',
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
  },
}

/**
 * Number input for numeric values.
 * Provides number-specific controls and validation.
 */
export const NumberInput: Story = {
  args: {
    id: 'age',
    label: 'Age',
    max: 120,
    min: 0,
    type: 'number',
  },
}

/**
 * Input with pre-filled value.
 * Shows how the component handles existing data.
 */
export const WithValue: Story = {
  args: {
    id: 'full-name',
    label: 'Full Name',
    value: 'John Doe',
  },
}
