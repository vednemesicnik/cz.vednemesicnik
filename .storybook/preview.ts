import type { Decorator, Preview } from '@storybook/react-vite'
import { useEffect } from 'react'

// Import global styles
import '../app/styles/fonts.css'
import '../app/styles/sizes.css'
import '../app/styles/global.css'
import '../app/styles/primitive-tokens.css'
import '../app/styles/semantic-tokens.css'

// Custom decorator to toggle color-scheme
const withColorScheme: Decorator = (Story, context) => {
  const colorScheme = context.globals.colorScheme || 'light'

  useEffect(() => {
    document.documentElement.style.colorScheme = colorScheme
  }, [colorScheme])

  return Story()
}

// Custom decorator to toggle the public/admin theme (data-theme on <html>)
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme || 'public'

  useEffect(() => {
    if (theme === 'admin') {
      document.documentElement.dataset.theme = 'admin'
    } else {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  return Story()
}

const preview: Preview = {
  decorators: [withColorScheme, withTheme],

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
    theme: {
      defaultValue: 'public',
      description: 'Interface theme (public website / administration)',
      toolbar: {
        dynamicTitle: true,
        icon: 'paintbrush',
        items: [
          { title: 'Public', value: 'public' },
          { title: 'Admin', value: 'admin' },
        ],
        title: 'Theme',
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
