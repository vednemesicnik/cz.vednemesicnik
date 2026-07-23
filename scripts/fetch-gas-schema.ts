#!/usr/bin/env tsx
import 'dotenv/config'

import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

import { GAS_ENDPOINTS, type GasEndpointName } from '@constants/gas-endpoints'

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
 * environment variable (see `constants/gas-endpoints.ts`).
 */

const FETCH_TIMEOUT_MS = 15000

const schemaPath = (name: string): string =>
  path.join(process.cwd(), 'schemas', name, 'response.schema.json')

const fetchSchema = async (name: GasEndpointName): Promise<void> => {
  const { urlEnvironmentVariable } = GAS_ENDPOINTS[name]
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

  // Guard against a valid-JSON non-schema (e.g. a GAS error payload like
  // `{ ok: false, error: … }`) being committed as the contract, which would
  // otherwise silently generate empty types. Require at least one JSON Schema
  // keyword at the root.
  const schemaKeywords = [
    '$schema',
    '$defs',
    'definitions',
    'properties',
    'type',
    'oneOf',
    'anyOf',
    'allOf',
    '$ref',
  ]

  if (!schemaKeywords.some((keyword) => keyword in schema)) {
    throw new Error(
      `${name} doGet did not return a JSON Schema (no schema keywords). ` +
        `Got keys: ${Object.keys(schema).join(', ') || '(none)'}.`,
    )
  }

  const target = schemaPath(name)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${JSON.stringify(schema, null, 2)}\n`)

  // Normalize to the repo's Biome format (what the pre-commit hook applies,
  // including sorted keys) so the committed schema matches it: re-fetching an
  // unchanged contract then yields no diff instead of key-order churn.
  execFileSync(
    path.join(process.cwd(), 'node_modules', '.bin', 'biome'),
    ['check', '--write', '--files-ignore-unknown=true', target],
    { stdio: 'ignore' },
  )

  console.info(`Wrote ${name} response schema to ${target}`)
}

const resolveNames = (): GasEndpointName[] => {
  const registered = Object.keys(GAS_ENDPOINTS) as GasEndpointName[]
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
