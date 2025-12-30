import type { Decorator, Preview } from '@storybook/react-vite'
import { useEffect } from 'react'

// Import global styles
import '../app/styles/colors.css'
import '../app/styles/fonts.css'
import '../app/styles/sizes.css'
import '../app/styles/global.css'
import '../app/styles/admin-design-tokens.css'

// Custom decorator to toggle color-scheme
const withColorScheme: Decorator = (Story, context) => {
  const colorScheme = context.globals.colorScheme || 'light'

  useEffect(() => {
    document.documentElement.style.colorScheme = colorScheme
  }, [colorScheme])

  return Story()
}

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
