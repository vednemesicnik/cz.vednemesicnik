import { ENV_META_NAME } from '~/config/env-meta-config'

/**
 * Sets `window.ENV` from the meta tag `Layout` renders. Call before anything reads
 * `ENV`. The tag comes in the same response as this code, so a missing one is a bug:
 * it throws, and the server-rendered page stays as it is, without hydration.
 */
export const initEnvClient = () => {
  const meta = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${ENV_META_NAME}"]`,
  )

  if (meta === null) {
    throw new Error(`Missing the ${ENV_META_NAME} meta tag`)
  }

  window.ENV = JSON.parse(meta.content)
}
