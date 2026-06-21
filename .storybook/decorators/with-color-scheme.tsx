import type { Decorator } from '@storybook/react-vite'
import { useEffect } from 'react'

export const withColorScheme: Decorator = (Story, context) => {
  const colorScheme = context.globals.colorScheme || 'light'

  useEffect(() => {
    document.documentElement.style.colorScheme = colorScheme
  }, [colorScheme])

  return Story()
}
