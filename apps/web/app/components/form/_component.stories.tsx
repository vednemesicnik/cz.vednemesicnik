import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '~/components/button'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldLabel } from '~/components/text-field-label'

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
 * A simple login form with e-mail and password fields.
 * Demonstrates basic form layout with Input and Button components.
 */
export const Playground: Story = {
  render: () => (
    <Form method="post">
      <TextField id="email" required>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl
          name="email"
          placeholder="your.email@example.com"
          type="email"
        />
      </TextField>
      <TextField id="password" required>
        <TextFieldLabel>Password</TextFieldLabel>
        <TextFieldControl
          name="password"
          placeholder="Enter your password"
          type="password"
        />
      </TextField>
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
      <TextField
        errors={['Please enter a valid email address']}
        id="email"
        required
      >
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl name="email" type="email" />
      </TextField>
      <TextField
        errors={[
          'Password must be at least 8 characters',
          'Password must contain at least one number',
        ]}
        id="password"
        required
      >
        <TextFieldLabel>Password</TextFieldLabel>
        <TextFieldControl name="password" type="password" />
      </TextField>
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
      <TextField id="email" required>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl
          name="email"
          placeholder="your.email@example.com"
          type="email"
        />
      </TextField>
      <TextField id="password" required>
        <TextFieldLabel>Password</TextFieldLabel>
        <TextFieldControl
          name="password"
          placeholder="Enter your password"
          type="password"
        />
      </TextField>
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
      <TextField id="name" required>
        <TextFieldLabel>Full Name</TextFieldLabel>
        <TextFieldControl name="name" placeholder="John Doe" type="text" />
      </TextField>
      <TextField id="email" required>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl
          name="email"
          placeholder="your.email@example.com"
          type="email"
        />
      </TextField>
      <TextField id="password" required>
        <TextFieldLabel>Password</TextFieldLabel>
        <TextFieldControl
          name="password"
          placeholder="Create a password"
          type="password"
        />
      </TextField>
      <TextField id="confirm-password" required>
        <TextFieldLabel>Confirm Password</TextFieldLabel>
        <TextFieldControl
          name="confirmPassword"
          placeholder="Confirm your password"
          type="password"
        />
      </TextField>
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
      <TextField id="username" required>
        <TextFieldLabel>Username</TextFieldLabel>
        <TextFieldControl
          name="username"
          placeholder="Enter username"
          type="text"
        />
      </TextField>
      <TextField id="email" required>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl
          name="email"
          placeholder="your.email@example.com"
          type="email"
        />
      </TextField>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </Form>
  ),
}
