import type { Preview } from '@storybook/react-vite'

// Import global styles
import '../app/styles/colors.css'
import '../app/styles/fonts.css'
import '../app/styles/sizes.css'
import '../app/styles/global.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

export default preview;