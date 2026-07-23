#!/usr/bin/env tsx
import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'

import { type GasEndpointName, gasEndpoints } from './gas-endpoints'

/**
 * Downloads the JSON-Schema response contract from a Google Apps Script web app
 * (its `doGet` returns the schema) and writes it to
 * `schemas/<name>/response.schema.json`.
 *
 * This is the network-facing half of the pipeline: run it on demand when a GAS
 * contract changes. The schema is committed as the source of truth (like
 * `prisma/schema.prisma`); `pnpm gas:types:generate` then derives the types
 * from it offline, so CI needs no network access.
 *
 * Usage: `pnpm gas:schema:fetch [name...]` — no argument fetches every
 * registered endpoint. Each endpoint's URL comes from its configured
 * environment variable (see `gas-endpoints.ts`).
 */

const FETCH_TIMEOUT_MS = 15000

const schemaPath = (name: string): string =>
  path.join(process.cwd(), 'schemas', name, 'response.schema.json')

const fetchSchema = async (name: GasEndpointName): Promise<void> => {
  const { urlEnvironmentVariable } = gasEndpoints[name]
  const url = process.env[urlEnvironmentVariable]

  if (!url) {
    throw new Error(
      `${urlEnvironmentVariable} is not set — cannot fetch the ${name} schema.`,
    )
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(
      `${name} doGet returned HTTP ${response.status} ${response.statusText}.`,
    )
  }

  const schema: unknown = await response.json()

  if (typeof schema !== 'object' || schema === null) {
    throw new Error(`${name} doGet did not return a JSON object.`)
  }

  const target = schemaPath(name)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${JSON.stringify(schema, null, 2)}\n`)

  console.info(`Wrote ${name} response schema to ${target}`)
}

const resolveNames = (): GasEndpointName[] => {
  const registered = Object.keys(gasEndpoints) as GasEndpointName[]
  const requested = process.argv.slice(2)

  if (requested.length === 0) {
    return registered
  }

  for (const name of requested) {
    if (!registered.includes(name as GasEndpointName)) {
      throw new Error(
        `Unknown GAS endpoint "${name}". Known: ${registered.join(', ')}.`,
      )
    }
  }

  return requested as GasEndpointName[]
}

const main = async (): Promise<void> => {
  for (const name of resolveNames()) {
    await fetchSchema(name)
  }
}

main().catch((error) => {
  console.error('Failed to fetch GAS schema:', error)
  process.exit(1)
})
