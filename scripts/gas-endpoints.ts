/**
 * Registry of Google Apps Script web apps whose JSON-Schema contracts are
 * turned into TypeScript types. Each app's `doGet` must return its JSON Schema.
 *
 * To add an endpoint: add an entry here, then run
 * `pnpm gas:schema:fetch <name>` (writes `schemas/<name>/response.schema.json`)
 * and `pnpm gas:types:generate` (writes `generated/<name>/response.ts`).
 *
 * The key is the folder name used under both `schemas/` and `generated/`.
 */
export const gasEndpoints = {
  'magic-link': {
    urlEnvironmentVariable: 'GAS_MAGIC_LINK_URL',
  },
} as const

export type GasEndpointName = keyof typeof gasEndpoints
