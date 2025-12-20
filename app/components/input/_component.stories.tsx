import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./_component"

const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Modern input field component with label, error messages, and comprehensive state management. Features smooth transitions, hover effects, and focus-visible box-shadow for keyboard navigation (Tab key). Uses form design tokens for consistent styling.",
      },
    },
  },
  argTypes: {
    label: {
      control: "text",
      description: "Label text for the input field",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
      description: "HTML input type attribute",
    },
    required: {
      control: "boolean",
      description: "Whether the input is required (shows asterisk in label)",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    errors: {
      control: "object",
      description:
        "Array of error messages to display. When present, input shows error styling with red border and focus shadow.",
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

/**
 * Default text input field with label.
 * The most common input variant for general text entry.
 */
export const Default: Story = {
  args: {
    label: "Username",
    id: "username",
    placeholder: "Enter your username",
  },
}

/**
 * Required input field indicated with an asterisk (*).
 * Use for mandatory form fields.
 */
export const Required: Story = {
  args: {
    label: "Email Address",
    id: "email",
    type: "email",
    placeholder: "user@example.com",
    required: true,
  },
}

/**
 * Input field with error messages displayed below.
 * Shows validation errors to the user.
 */
export const WithErrors: Story = {
  args: {
    label: "Password",
    id: "password",
    type: "password",
    errors: [
      "Password must be at least 8 characters",
      "Password must contain at least one number",
    ],
  },
}

/**
 * Disabled input field prevents user interaction.
 * The field appears visually muted and cannot be edited.
 */
export const Disabled: Story = {
  args: {
    label: "Account ID",
    id: "account-id",
    value: "12345",
    disabled: true,
  },
}

/**
 * Email input with appropriate input type.
 * Provides email validation and mobile keyboard optimization.
 */
export const EmailInput: Story = {
  args: {
    label: "Email",
    id: "email-field",
    type: "email",
    placeholder: "name@example.com",
  },
}

/**
 * Password input with obscured text.
 * Characters are hidden for security.
 */
export const PasswordInput: Story = {
  args: {
    label: "Password",
    id: "password-field",
    type: "password",
    placeholder: "Enter your password",
  },
}

/**
 * Number input for numeric values.
 * Provides number-specific controls and validation.
 */
export const NumberInput: Story = {
  args: {
    label: "Age",
    id: "age",
    type: "number",
    min: 0,
    max: 120,
  },
}

/**
 * Input with pre-filled value.
 * Shows how the component handles existing data.
 */
export const WithValue: Story = {
  args: {
    label: "Full Name",
    id: "full-name",
    value: "John Doe",
  },
}
