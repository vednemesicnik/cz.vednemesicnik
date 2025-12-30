import type { Meta, StoryObj } from '@storybook/react-vite'
import { AdminInput } from '~/components/admin-input'
import { Button } from '~/components/button'

import { Form } from './_component'

const meta: Meta<typeof Form> = {
  argTypes: {
    errors: {
      control: 'object',
      description:
        'Array of form-level error messages (displayed at the top of the form)',
    },
    method: {
      control: 'select',
      description: 'HTTP method for form submission',
      options: ['get', 'post'],
    },
  },
  component: Form,
  parameters: {
    docs: {
      description: {
        component:
          'Form wrapper component with built-in error handling and proper spacing. Provides consistent layout and gap between form fields. Uses form design tokens for spacing and max-width constraints.',
      },
    },
  },
  tags: ['autodocs'],
  title: 'Primitives/Form',
}

export default meta
type Story = StoryObj<typeof Form>

/**
 * Simple login form with email and password fields.
 * Demonstrates basic form layout with Input and Button components.
 */
export const LoginForm: Story = {
  render: () => (
    <Form method="post">
      <AdminInput
        id="email"
        label="Email"
        name="email"
        placeholder="your.email@example.com"
        required
        type="email"
      />
      <AdminInput
        id="password"
        label="Password"
        name="password"
        placeholder="Enter your password"
        required
        type="password"
      />
      <Button type="submit" variant="primary">
        Sign In
      </Button>
    </Form>
  ),
}

/**
 * Form with validation errors on individual fields.
 * Shows how error messages appear below each input field.
 */
export const WithFieldErrors: Story = {
  render: () => (
    <Form method="post">
      <AdminInput
        errors={['Please enter a valid email address']}
        id="email"
        label="Email"
        name="email"
        required
        type="email"
      />
      <AdminInput
        errors={[
          'Password must be at least 8 characters',
          'Password must contain at least one number',
        ]}
        id="password"
        label="Password"
        name="password"
        required
        type="password"
      />
      <Button type="submit" variant="primary">
        Sign In
      </Button>
    </Form>
  ),
}

/**
 * Form with form-level errors displayed at the top.
 * Use for general errors that don't relate to a specific field.
 */
export const WithFormErrors: Story = {
  render: () => (
    <Form
      errors={[
        'Invalid credentials. Please check your email and password.',
        'Your account has been locked after multiple failed attempts.',
      ]}
      method="post"
    >
      <AdminInput
        id="email"
        label="Email"
        name="email"
        placeholder="your.email@example.com"
        required
        type="email"
      />
      <AdminInput
        id="password"
        label="Password"
        name="password"
        placeholder="Enter your password"
        required
        type="password"
      />
      <Button type="submit" variant="primary">
        Sign In
      </Button>
    </Form>
  ),
}

/**
 * Registration form with multiple fields.
 * Demonstrates form spacing with various input types.
 */
export const RegistrationForm: Story = {
  render: () => (
    <Form method="post">
      <AdminInput
        id="name"
        label="Full Name"
        name="name"
        placeholder="John Doe"
        required
        type="text"
      />
      <AdminInput
        id="email"
        label="Email"
        name="email"
        placeholder="your.email@example.com"
        required
        type="email"
      />
      <AdminInput
        id="password"
        label="Password"
        name="password"
        placeholder="Create a password"
        required
        type="password"
      />
      <AdminInput
        id="confirm-password"
        label="Confirm Password"
        name="confirmPassword"
        placeholder="Confirm your password"
        required
        type="password"
      />
      <Button type="submit" variant="primary">
        Create Account
      </Button>
    </Form>
  ),
}

/**
 * Form with multiple buttons showing different variants.
 * Demonstrates primary and default button combinations.
 */
export const FormWithMultipleActions: Story = {
  render: () => (
    <Form method="post">
      <AdminInput
        id="username"
        label="Username"
        name="username"
        placeholder="Enter username"
        required
        type="text"
      />
      <AdminInput
        id="email"
        label="Email"
        name="email"
        placeholder="your.email@example.com"
        required
        type="email"
      />
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Button type="button" variant="default">
          Cancel
        </Button>
      </div>
    </Form>
  ),
}
