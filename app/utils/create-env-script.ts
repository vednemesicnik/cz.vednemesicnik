/**
 * Builds the inline script that sets `window.ENV`. `<` is escaped, so no value can
 * close the script element it is written into.
 *
 * @param environment - The client-safe environment variables (`getEnv`).
 * @returns The script's source.
 */
export const createEnvScript = (environment: typeof ENV) => {
  const json = JSON.stringify(environment).replaceAll('<', '\\u003c')

  return `window.ENV = ${json};`
}
