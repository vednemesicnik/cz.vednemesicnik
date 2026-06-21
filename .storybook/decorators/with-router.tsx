import type { Decorator } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

export const withRouter: Decorator = (Story) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
)
