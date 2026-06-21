import type { Preview } from '@storybook/react-vite'

// Import global styles
import '../app/styles/colors.css'
import '../app/styles/fonts.css'
import '../app/styles/sizes.css'
import '../app/styles/global.css'
import '../app/styles/primitive-tokens.css'
// import '../app/styles/admin-semantic-tokens.css'
import '../app/styles/public-semantic-tokens.css'

import { withColorScheme } from './decorators/with-color-scheme'

const preview: Preview = {
  decorators: [withColorScheme],

  globalTypes: {
    colorScheme: {
      defaultValue: 'light',
      description: 'Color scheme for components',
      toolbar: {
        dynamicTitle: true,
        icon: 'circlehollow',
        items: [
          { icon: 'sun', title: 'Light', value: 'light' },
          { icon: 'moon', title: 'Dark', value: 'dark' },
        ],
        title: 'Color Scheme',
      },
    },
  },

  parameters: {
    a11y: {
      config: {
        rules: [
          {
            enabled: true,
            id: 'color-contrast',
          },
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
