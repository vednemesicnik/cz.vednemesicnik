import type { Preview, Decorator } from "@storybook/react-vite"
import { useEffect } from "react"

// Import global styles
import "../app/styles/colors.css"
import "../app/styles/fonts.css"
import "../app/styles/sizes.css"
import "../app/styles/global.css"
import "../app/styles/admin-tokens.css"

// Custom decorator to toggle color-scheme
const withColorScheme: Decorator = (Story, context) => {
  const colorScheme = context.globals.colorScheme || "light"

  useEffect(() => {
    document.documentElement.style.colorScheme = colorScheme
  }, [colorScheme])

  return Story()
}

const preview: Preview = {
  decorators: [withColorScheme],

  globalTypes: {
    colorScheme: {
      description: "Color scheme for components",
      defaultValue: "light",
      toolbar: {
        title: "Color Scheme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },

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
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
    },
  },
}

export default preview
