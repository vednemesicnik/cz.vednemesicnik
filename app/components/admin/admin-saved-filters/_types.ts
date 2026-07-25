import type { SubmissionResult } from '@conform-to/react'
import type { FetcherWithComponents } from 'react-router'

export type OwnFilter = {
  id: string
  isDefault: boolean
  isShared: boolean
  name: string
  query: string
}

export type SharedFilter = {
  id: string
  name: string
  ownerName: string
  query: string
}

/**
 * What `/administration/filters` replies with: every intent returns the Conform
 * submission result, `create-filter` additionally the new row's id.
 */
export type FilterActionData = {
  filterId?: string
  submissionResult: SubmissionResult
}

export type FilterFetcher = FetcherWithComponents<FilterActionData>
