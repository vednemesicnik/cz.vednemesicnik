#!/usr/bin/env tsx
import fs from 'node:fs/promises'
import path from 'node:path'
import { GAS_ENDPOINTS, type GasEndpointName } from '@constants/gas-endpoints'
import { compileFromFile } from 'json-schema-to-typescript'

/**
 * Generates TypeScript types from every committed GAS response schema
 * (`schemas/<name>/response.schema.json`) into `generated/<name>/response.ts`.
 *
 * This is the offline, deterministic half of the pipeline (no network): it runs
 * in CI alongside `prisma:generate` so the generated types stay in sync with the
 * committed schemas. Refresh a schema itself with `pnpm gas:schema:fetch`.
 */

const schemaPath = (name: string): string =>
  path.join(process.cwd(), 'schemas', name, 'response.schema.json')

const outputPath = (name: string): string =>
  path.join(process.cwd(), 'generated', name, 'response.ts')

const generateTypes = async (name: GasEndpointName): Promise<void> => {
  const types = await compileFromFile(schemaPath(name), {
    bannerComment:
      `// AUTO-GENERATED from schemas/${name}/response.schema.json.\n` +
      '// Do not edit by hand — run `pnpm gas:types:generate`.',
    style: { semi: false, singleQuote: true },
    // GAS schemas expose their shapes under `definitions` without referencing
    // them from the root, so emit those unreferenced definitions as named types.
    unreachableDefinitions: true,
  })

  const target = outputPath(name)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, types)

  console.info(`Wrote ${name} types to ${target}`)
}

const main = async (): Promise<void> => {
  for (const name of Object.keys(GAS_ENDPOINTS) as GasEndpointName[]) {
    await generateTypes(name)
  }
}

main().catch((error) => {
  console.error('Failed to generate GAS types:', error)
  process.exit(1)
})
