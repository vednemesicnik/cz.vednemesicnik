import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: '.storybook/vite.config.ts',
      },
    },
  },
  stories: ['../app/**/*.stories.@(js|jsx|mjs|ts|tsx)', '../app/**/*.mdx'],
}
export default config
