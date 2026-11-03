/**
 * Writes to the editorial-board spreadsheet through the Google Apps Script web app
 * (see the SCRIPT__Editorial_Board__Membership repo): an application on enrolment,
 * and someone's confirmation or departure.
 *
 * Unlike the read in `editorial-board.server.ts` this is not best-effort: the caller
 * has to know whether the write happened, because a lost write is an enrolment nobody
 * ever learns about. It never throws; failures are logged and reported to Sentry.
 *
 * The idempotency key is one per call, so the transport's retry is one write, and a new
 * press of a button is a new key that the state of the sheet decides. A key derived
 * from the link would answer from the script's cache for its whole lifetime, past a
 * change to the row (log 0064).
 *
 * No-ops when GAS_EDITORIAL_BOARD_MEMBERSHIP_URL / _SECRET are unset outside
 * production, so the flows can be exercised without a live deployment.
 */

import { randomUUID } from 'node:crypto'
import type {
  ConfirmActiveRequest,
  EditorialBoardMembershipResponse,
  EnrolRequest,
  LeaveRequest,
} from '@generated/editorial-board-membership/response'
import * as Sentry from '@sentry/react-router'
import { z } from 'zod'

import { postSignedGasRequest } from './post-signed-gas-request.server'

// Enough for the script's 15 s wait for its lock and the sheet behind it, and two
// attempts stay under Cloudflare's 100 s.
const WRITE_TIMEOUT_MILLISECONDS = 30_000

type ContractRequest = ConfirmActiveRequest | EnrolRequest | LeaveRequest

type ContractSuccessResponse = Extract<
  EditorialBoardMembershipResponse,
  { ok: true }
>

type ContractErrorCode = Extract<
  EditorialBoardMembershipResponse,
  { ok: false }
>['error']

export type EditorialBoardMembershipWrite =
  | Omit<ConfirmActiveRequest, 'idempotencyKey'>
  | Omit<EnrolRequest, 'idempotencyKey'>
  | Omit<LeaveRequest, 'idempotencyKey'>

export type EditorialBoardMembershipError =
  | ContractErrorCode
  | 'unknown'
  | 'unreachable'

export type EditorialBoardMembershipResult =
  | { idempotent: boolean; ok: true }
  | {
      error: EditorialBoardMembershipError
      ok: false
      retryable: boolean
    }

// Pinned to the generated contract (schemas/editorial-board-membership): if the
// contract gains or retypes a field this no longer matches, `pnpm app:typecheck` fails.
const responseSchema = z.object({
  idempotent: z.literal(true).optional(),
  ok: z.literal(true),
}) satisfies z.ZodType<ContractSuccessResponse>

// Exhaustive at compile time: a code added to or removed from the contract fails
// `pnpm app:typecheck` until this matches. Bounds the Sentry fingerprints to a fixed
// set, so an unexpected value can't mint an issue per occurrence.
const KNOWN_GAS_ERROR_CODES: Record<ContractErrorCode, true> = {
  ambiguous: true,
  busy: true,
  invalid_request: true,
  missing_fields: true,
  not_active: true,
  not_found: true,
  server_error: true,
  server_misconfigured: true,
  stale_timestamp: true,
  unauthorized: true,
}

// Answers about a person rather than faults: someone taken off the sheet or set out by
// hand can still press a button in an old e-mail.
const EXPECTED_ERRORS = new Set<EditorialBoardMembershipError>([
  'not_active',
  'not_found',
])

const FINGERPRINT = ['editorial-board-membership', 'gas-write-failed']

const toKnownError = (error: string): EditorialBoardMembershipError => {
  if (error === 'unreachable') {
    return error
  }

  return Object.hasOwn(KNOWN_GAS_ERROR_CODES, error)
    ? (error as ContractErrorCode)
    : 'unknown'
}

const reportFailure = (
  error: EditorialBoardMembershipError,
  extra: Record<string, unknown>,
): void => {
  console.error(`[editorial-board-membership] write failed — error ${error}.`)

  // Fly logs are short-lived; Sentry keeps failures diagnosable. A stable message and
  // fingerprint group a sustained outage into one issue per code.
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage('[editorial-board-membership] write failed', {
      extra,
      fingerprint: [...FINGERPRINT, error],
      level: 'error',
    })
  }
}

/**
 * Makes one write to the editorial-board spreadsheet.
 *
 * @param write - The action and its fields; the idempotency key is added here.
 * @returns `idempotent` when an earlier attempt did the work. On failure, `error` says
 *   why, and `retryable` whether asking again could help: `not_found` and `not_active`
 *   are answers, `unreachable` means the write may or may not have happened and is safe
 *   to try again. Never throws.
 */
export const postEditorialBoardMembershipWrite = async (
  write: EditorialBoardMembershipWrite,
): Promise<EditorialBoardMembershipResult> => {
  const url = process.env.GAS_EDITORIAL_BOARD_MEMBERSHIP_URL
  const secret = process.env.GAS_EDITORIAL_BOARD_MEMBERSHIP_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[editorial-board-membership] GAS URL/SECRET not set — nothing written.',
      )
      return { error: 'server_misconfigured', ok: false, retryable: false }
    }

    // Local dev without a deployment: log, so a flow is usable end to end without
    // writing anyone's details anywhere.
    console.info(
      `[editorial-board-membership] GAS not configured — ${write.action} not written.`,
    )
    return { idempotent: false, ok: true }
  }

  const result = await postSignedGasRequest<
    ContractSuccessResponse,
    ContractRequest
  >(
    { endpoint: 'editorial-board-membership', secret, url },
    { ...write, idempotencyKey: randomUUID() },
    {
      idempotencyKeyField: 'idempotencyKey',
      timeoutMilliseconds: WRITE_TIMEOUT_MILLISECONDS,
    },
  )

  if (result.ok) {
    const parsed = responseSchema.safeParse(result)

    if (parsed.success) {
      return { idempotent: parsed.data.idempotent === true, ok: true }
    }

    reportFailure('unknown', { action: write.action, malformed: true })
    return { error: 'unknown', ok: false, retryable: true }
  }

  const error = toKnownError(result.error)

  if (result.cause !== undefined) {
    console.error(
      '[editorial-board-membership] GAS request threw —',
      result.cause,
    )
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(result.cause, {
        fingerprint: ['editorial-board-membership', 'gas-request-threw'],
      })
    }
  } else if (!EXPECTED_ERRORS.has(error)) {
    reportFailure(error, {
      action: write.action,
      gasError: result.error,
      status: result.status,
    })
  }

  return { error, ok: false, retryable: result.retryable }
}
