import type { Meta, StoryObj } from "@storybook/react-vite"

import { ErrorMessage } from "~/components/error-message"

import { ErrorMessageGroup } from "./_component"

const meta: Meta<typeof ErrorMessageGroup> = {
  title: "Primitives/ErrorMessageGroup",
  component: ErrorMessageGroup,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "ErrorMessage components to display in the group",
    },
  },
}

export default meta
type Story = StoryObj<typeof ErrorMessageGroup>

/**
 * Empty error group with no messages.
 * The component renders but displays nothing when there are no errors.
 */
export const Empty: Story = {
  render: () => <ErrorMessageGroup>{null}</ErrorMessageGroup>,
}

/**
 * Error group with a single error message.
 * Most common use case for field validation.
 */
export const SingleError: Story = {
  render: () => (
    <ErrorMessageGroup>
      <ErrorMessage>This field is required</ErrorMessage>
    </ErrorMessageGroup>
  ),
}

/**
 * Error group with multiple error messages.
 * Shows all validation errors for a field at once.
 */
export const MultipleErrors: Story = {
  render: () => (
    <ErrorMessageGroup>
      <ErrorMessage>Password must be at least 8 characters</ErrorMessage>
      <ErrorMessage>Password must contain at least one number</ErrorMessage>
      <ErrorMessage>
        Password must contain at least one special character
      </ErrorMessage>
    </ErrorMessageGroup>
  ),
}

/**
 * Error group with two errors.
 * Common scenario for fields with multiple validation rules.
 */
export const TwoErrors: Story = {
  render: () => (
    <ErrorMessageGroup>
      <ErrorMessage>Email format is invalid</ErrorMessage>
      <ErrorMessage>This email is already registered</ErrorMessage>
    </ErrorMessageGroup>
  ),
}

/**
 * Error group with varied error lengths.
 * Demonstrates handling of short and long error messages together.
 */
export const MixedLengthErrors: Story = {
  render: () => (
    <ErrorMessageGroup>
      <ErrorMessage>Required field</ErrorMessage>
      <ErrorMessage>
        The value you entered does not match the required format. Please ensure
        you follow the pattern: XXX-XXX-XXXX
      </ErrorMessage>
      <ErrorMessage>Must be unique</ErrorMessage>
    </ErrorMessageGroup>
  ),
}

/**
 * Error group for form validation.
 * Real-world example showing typical form field errors.
 */
export const FormValidation: Story = {
  render: () => (
    <ErrorMessageGroup>
      <ErrorMessage>Username must be at least 3 characters</ErrorMessage>
      <ErrorMessage>Username can only contain letters and numbers</ErrorMessage>
      <ErrorMessage>Username is already taken</ErrorMessage>
    </ErrorMessageGroup>
  ),
}