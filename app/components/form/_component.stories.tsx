import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "~/components/button"
import { Input } from "~/components/input"

import { Form } from "./_component"

const meta: Meta<typeof Form> = {
  title: "Primitives/Form",
  component: Form,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Form wrapper component with built-in error handling and proper spacing. Provides consistent layout and gap between form fields. Uses form design tokens for spacing and max-width constraints.",
      },
    },
  },
  argTypes: {
    errors: {
      control: "object",
      description:
        "Array of form-level error messages (displayed at the top of the form)",
    },
    method: {
      control: "select",
      options: ["get", "post"],
      description: "HTTP method for form submission",
    },
  },
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
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="your.email@example.com"
        required
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        placeholder="Enter your password"
        required
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
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        required
        errors={["Please enter a valid email address"]}
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        required
        errors={[
          "Password must be at least 8 characters",
          "Password must contain at least one number",
        ]}
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
      method="post"
      errors={[
        "Invalid credentials. Please check your email and password.",
        "Your account has been locked after multiple failed attempts.",
      ]}
    >
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="your.email@example.com"
        required
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        placeholder="Enter your password"
        required
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
      <Input
        label="Full Name"
        id="name"
        name="name"
        type="text"
        placeholder="John Doe"
        required
      />
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="your.email@example.com"
        required
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        placeholder="Create a password"
        required
      />
      <Input
        label="Confirm Password"
        id="confirm-password"
        name="confirmPassword"
        type="password"
        placeholder="Confirm your password"
        required
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
      <Input
        label="Username"
        id="username"
        name="username"
        type="text"
        placeholder="Enter username"
        required
      />
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="your.email@example.com"
        required
      />
      <div style={{ display: "flex", gap: "12px" }}>
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
