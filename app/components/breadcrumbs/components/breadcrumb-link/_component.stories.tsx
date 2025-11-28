import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router"

import { BreadcrumbLink } from "./_component"

const meta: Meta<typeof BreadcrumbLink> = {
  title: "Navigation/BreadcrumbLink",
  component: BreadcrumbLink,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof BreadcrumbLink>

export const Default: Story = {
  render: (args) => <BreadcrumbLink to={args.to}>{args.children}</BreadcrumbLink>,
  args: {
    to: "/home",
    children: "Home",
  },
}
