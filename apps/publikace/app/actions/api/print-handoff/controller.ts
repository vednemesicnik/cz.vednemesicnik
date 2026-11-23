import { createController } from 'remix/router'

import type { IdentityTokenVerifier } from '../../../auth/identity-token.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import type {
  ArticleCopy,
  ClaimedIssue,
  IssueReport,
  PrintHandoffStore,
} from '../../../data/print-handoff.server.ts'
import {
  COPY_PROPERTY,
  ERROR_TEXT_LIMIT,
  ISSUE_CLAIM_LIMIT,
  PRINT_HANDOFF_JOB,
} from '../../../domain/print-handoff.ts'
import { routes } from '../../../routes.ts'
import { bodyOf, intervalOf, isText, json, refusal } from '../job-request.ts'

/**
 * The API that `SCRIPT__Publication__Print_Handoff` fills the print folders of the issues made in
 * the app through (#110): a standalone Apps Script project running as `publikace.app@` on its own
 * trigger, every six hours. `Designer_Handoff` under `publikace@` keeps the issues on the Registr's
 * list _Vydání_ until the cutover. One run, _Podklady pro tisk_ (`14d`), makes two calls:
 *
 * 1. `claim` with the trigger's interval opens the run and takes every open issue with a print
 *    folder (`printFolderId`) and its _Podklady_ sheet once there is one (`sheetId`). Per article it
 *    gives what belongs in the folder, `text` (the newest final version every author agreed to,
 *    with `revisedAfter`, the moment after which an edit of the Doc is not in it, and `isStanding`)
 *    and `artworks` (those whose conversation is in `Licence`, with the source file, the author and
 *    the source for the sheet), beside `copy`, what the folder holds as the last report left it.
 *    The job makes the article's folder, exports the Doc as a Google Doc while it has no revision
 *    after `revisedAfter`, copies each new artwork as `obr-NN` after `lastImageNumber`, and bins
 *    the copies of what is no longer listed: an artwork that lost its consent, or a whole article
 *    with neither text nor artworks. A text revised after its version, or a version that is no
 *    longer standing, keeps the copy it has, flagged `isTextChanged`.
 * 2. `report` with the run's key gives, per issue it worked on, the sheet, whether it got through
 *    the whole issue (`isComplete`), and per article it reached the copy now in the folder, or
 *    `null` once the folder is gone. An article left out stays as it was. It closes the run.
 *    Besides the limits on one issue and one article, the report as a whole holds at most
 *    `MAX_REPORT_ARTICLES` articles and `MAX_REPORT_ARTWORKS` artworks, or nothing is recorded.
 *
 * Every file the job makes carries its tag in `appProperties` under `publikaceHandoff`:
 * `folderTag` on an article's folder, `copyTag` on a text or an artwork. Before it creates one, the
 * job looks for that tag in the print folder and takes what it finds, so a run that died between
 * copying and reporting leaves no second copy.
 *
 * Every call carries the job's Google identity token as a bearer, and only the account in
 * `SCRIPT_JOB_ACCOUNT` is let in. A path or a field is never renamed in place: the job's deployed
 * code is its contract, and a change is a new version.
 */

export type PrintHandoffDependencies = {
  handoffs: PrintHandoffStore
  /** The account the jobs run as, in lower case. */
  jobAccount: string
  now: () => Temporal.Instant
  runs: JobRunStore
  verifyIdentityToken: IdentityTokenVerifier
}

const MAX_ID_LENGTH = 200
const MAX_NAME_LENGTH = 200
/* An issue has tens of articles and an article tens of artworks; the limits only stop nonsense. */
const MAX_ARTICLES = 500
const MAX_ARTWORKS = 500
/*
 * A report holds up to `ISSUE_CLAIM_LIMIT` issues and is recorded in transactions every other
 * request waits behind, so the report as a whole is bounded too. A real run carries a few open
 * issues of tens of articles, far under either.
 */
const MAX_REPORT_ARTICLES = 500
const MAX_REPORT_ARTWORKS = 5000
const MAX_IMAGE_NUMBER = 9999

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isOptionalText(value: unknown, max: number): value is string | null {
  return value === null || isText(value, max)
}

function readCopy(value: unknown): ArticleCopy | null | undefined {
  if (value === null) return null
  if (typeof value !== 'object' || Array.isArray(value)) return undefined
  let fields = value as Record<string, unknown>
  let { artworks, folderId, isTextChanged, lastImageNumber, textFileId, textFinalVersionId } =
    fields
  if (
    !isText(folderId, MAX_ID_LENGTH) ||
    !isOptionalText(textFileId, MAX_ID_LENGTH) ||
    !(textFinalVersionId === null || isId(textFinalVersionId)) ||
    typeof isTextChanged !== 'boolean' ||
    typeof lastImageNumber !== 'number' ||
    !Number.isInteger(lastImageNumber) ||
    lastImageNumber < 0 ||
    lastImageNumber > MAX_IMAGE_NUMBER ||
    !Array.isArray(artworks) ||
    artworks.length > MAX_ARTWORKS
  ) {
    return undefined
  }
  let copies: ArticleCopy['artworks'] = []
  for (let artwork of artworks as unknown[]) {
    if (typeof artwork !== 'object' || artwork === null) return undefined
    let { artworkId, fileId, name } = artwork as Record<string, unknown>
    if (!isId(artworkId) || !isText(fileId, MAX_ID_LENGTH) || !isText(name, MAX_NAME_LENGTH)) {
      return undefined
    }
    copies.push({ artworkId, fileId, name })
  }
  return {
    artworks: copies,
    folderId,
    isTextChanged,
    lastImageNumber,
    textFileId,
    textFinalVersionId,
  }
}

function readIssue(value: unknown): IssueReport | null {
  if (typeof value !== 'object' || value === null) return null
  let { articles, isComplete, issueId, sheetId } = value as Record<string, unknown>
  if (
    !isId(issueId) ||
    typeof isComplete !== 'boolean' ||
    !isOptionalText(sheetId ?? null, MAX_ID_LENGTH) ||
    !Array.isArray(articles) ||
    articles.length > MAX_ARTICLES
  ) {
    return null
  }
  let read: IssueReport['articles'] = []
  for (let article of articles as unknown[]) {
    if (typeof article !== 'object' || article === null) return null
    let fields = article as Record<string, unknown>
    let copy = readCopy(fields['copy'])
    if (!isId(fields['articleId']) || copy === undefined) return null
    read.push({ articleId: fields['articleId'], copy })
  }
  return { articles: read, isComplete, issueId, sheetId: (sheetId as string | null) ?? null }
}

function isWithinTotals(issues: readonly IssueReport[]): boolean {
  let articles = 0
  let artworks = 0
  for (let issue of issues) {
    articles += issue.articles.length
    for (let article of issue.articles) artworks += article.copy?.artworks.length ?? 0
  }
  return articles <= MAX_REPORT_ARTICLES && artworks <= MAX_REPORT_ARTWORKS
}

/** One issue as the job gets it; instants as ISO 8601. */
function claimedIssue(issue: ClaimedIssue) {
  return {
    ...issue,
    articles: issue.articles.map((article) => ({
      ...article,
      text:
        article.text === null
          ? null
          : { ...article.text, revisedAfter: article.text.revisedAfter.toString() },
    })),
  }
}

export default function createPrintHandoffController(dependencies: PrintHandoffDependencies) {
  return createController(routes.api.printHandoff, {
    actions: {
      async claim(context) {
        let refused = await refusal(context.request, dependencies)
        if (refused !== null) return refused
        let interval = intervalOf(await bodyOf(context.request))
        if (interval === null) return json({ error: 'invalid_request' }, 400)

        let at = dependencies.now()
        let runKey = crypto.randomUUID()
        await dependencies.runs.start({
          at,
          intervalMinutes: interval,
          job: PRINT_HANDOFF_JOB,
          runKey,
        })
        let issues = await dependencies.handoffs.claim(runKey, at)
        return json({ copyProperty: COPY_PROPERTY, issues: issues.map(claimedIssue), runKey })
      },

      async report(context) {
        let refused = await refusal(context.request, dependencies)
        if (refused !== null) return refused
        let body = await bodyOf(context.request)
        let runKey = body?.['runKey']
        let outcome = body?.['outcome']
        /* An empty text says nothing, as no text does. */
        let error = body?.['error'] === '' ? null : body?.['error']
        let issues = body?.['issues']
        if (
          !isText(runKey, MAX_ID_LENGTH) ||
          (outcome !== 'ok' && outcome !== 'failed') ||
          (error !== undefined && error !== null && !isText(error, ERROR_TEXT_LIMIT)) ||
          !Array.isArray(issues) ||
          issues.length > ISSUE_CLAIM_LIMIT
        ) {
          return json({ error: 'invalid_request' }, 400)
        }
        let read = (issues as unknown[]).map(readIssue)
        if (!read.every((issue) => issue !== null) || !isWithinTotals(read)) {
          return json({ error: 'invalid_request' }, 400)
        }
        if (!(await dependencies.runs.isOpen(PRINT_HANDOFF_JOB, runKey))) {
          return json({ error: 'unknown_run' }, 409)
        }

        let answers = []
        for (let issue of read) {
          let answer = await dependencies.handoffs.record(runKey, issue)
          answers.push({ answer, issueId: issue.issueId })
        }
        await dependencies.runs.finish(PRINT_HANDOFF_JOB, runKey, {
          at: dependencies.now(),
          error: typeof error === 'string' ? error : null,
          outcome,
        })
        return json({ issues: answers })
      },
    },
  })
}
