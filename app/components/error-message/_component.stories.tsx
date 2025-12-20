import type { Meta, StoryObj } from "@storybook/react-vite"

import { ErrorMessage } from "./_component"

const meta: Meta<typeof ErrorMessage> = {
  title: "Primitives/ErrorMessage",
  component: ErrorMessage,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Error message text content",
    },
  },
}

export default meta
type Story = StoryObj<typeof ErrorMessage>

/**
 * Default error message with icon and alert role.
 * Displays validation or system errors to the user.
 */
export const Default: Story = {
  args: {
    children: "This field is required",
  },
}

/**
 * Error message for invalid email format.
 * Common validation error for email inputs.
 */
export const InvalidEmail: Story = {
  args: {
    children: "Please enter a valid email address",
  },
}

/**
 * Error message for password requirements.
 * Shows specific validation rules that failed.
 */
export const PasswordTooShort: Story = {
  args: {
    children: "Password must be at least 8 characters long",
  },
}

/**
 * Error message for server-side validation.
 * Displays errors returned from API or backend.
 */
export const ServerError: Story = {
  args: {
    children: "Username already exists. Please choose another.",
  },
}

/**
 * Long error message text.
 * Shows how the component handles verbose error descriptions.
 */
export const LongMessage: Story = {
  args: {
    children:
      "The file you are trying to upload exceeds the maximum size limit of 5MB. Please compress or resize the file and try again.",
  },
}

/**
 * Error message for numeric validation.
 * Common for number input fields with constraints.
 */
export const OutOfRange: Story = {
  args: {
    children: "Value must be between 1 and 100",
  },
}

/**
 * Error message for required field selection.
 * Used with select dropdowns and radio buttons.
 */
export const SelectionRequired: Story = {
  args: {
    children: "Please select at least one option",
  },
}

/**
 * Error message for pattern mismatch.
 * Shows when input doesn't match required format.
 */
export const InvalidFormat: Story = {
  args: {
    children: "Phone number must be in format: (123) 456-7890",
  },
}
