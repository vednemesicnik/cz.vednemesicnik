import { redirect } from 'remix/response/redirect'
import {
  AGREED_AUTHOR_TAG,
  agreedMeanwhileToast,
  ARTICLE_RENAMED_MEANWHILE_TOAST,
  ARTICLE_RENAMED_TOAST,
  AUTHORS_DISCONNECTED,
  AUTHORS_FOLDER_MISSING,
  authorsMetaBinned,
  AUTHORS_SAVED_TOAST,
  AUTHORS_UNAVAILABLE,
  authorsSavedToast,
  ARTICLE_REMOVED_TOAST,
  articleForeignFilesCallout,
  canEditAuthors,
  canRemoveArticle,
  canRenameArticle,
  CLAUSES_CORRECTED_TOAST,
  movedArticleFolderCallout,
  REMOVE_ARTICLE_ARTWORKS_TOAST,
  REMOVE_ARTICLE_DISCONNECTED,
  REMOVE_ARTICLE_UNAVAILABLE,
  removeArticleClosedToast,
  removeArticleDialogText,
  removeArticleTakenToast,
  editAuthorsLead,
  editAuthorsNote,
  FINAL_VERSION_CANCELLED_TOAST,
  FINAL_VERSION_MEANWHILE_TOAST,
  authorsClosedToast,
  articleRenameClosedToast,
  isAgreed,
  RENAME_ARTICLE_DISCONNECTED,
  RENAME_ARTICLE_DOC_MISSING,
  RENAME_ARTICLE_FOLDER_MISSING,
  renameArticleMetaBinned,
  RENAME_ARTICLE_UNAVAILABLE,
  renameTooLateToast,
  SAVE_AUTHORS_LABEL,
  SAVE_AUTHORS_PENDING_LABEL,
} from '../../domain/article-fixes.ts'
import {
  checkArticleName,
  checkAuthors,
  type FieldError,
} from '../../domain/public/article-form.ts'
import {
  type ArticleFixSetup,
  editAuthors,
  type EditAuthorsFixOutcome,
  removeArticle,
  renameArticle,
} from '../../drive/article-fixes.server.ts'
import {
  AUTHOR_EMAIL_FIELD,
  AUTHOR_NAME_FIELD,
  type AuthorCardView,
} from '../../ui/public/author-cards/component.tsx'
import type { ArticleFixView } from './article-fix-dialogs.tsx'
import type { GroupRow } from '../../data/artwork-groups.server.ts'
import {
  canEditGroup,
  canRemoveGroup,
  editGroupClosedToast,
  GROUP_CHANGED_MEANWHILE_TOAST,
  GROUP_NOTE_SAVED_TOAST,
  GROUP_REMOVED_MEANWHILE_TOAST,
  GROUP_REMOVED_TOAST,
  GROUP_RENAMED_TOAST,
  groupForeignFilesCallout,
  movedGroupFolderCallout,
  REMOVE_GROUP_ARTWORKS_TOAST,
  REMOVE_GROUP_DISCONNECTED,
  REMOVE_GROUP_UNAVAILABLE,
  removeGroupClosedToast,
  removeGroupDialogText,
  removeGroupTitle,
  RENAME_GROUP_DISCONNECTED,
  RENAME_GROUP_FOLDER_MISSING,
  RENAME_GROUP_UNAVAILABLE,
  renameGroupMetaBinned,
} from '../../domain/group-fixes.ts'
import { editGroup, type GroupFixSetup, removeGroup } from '../../drive/group-fixes.server.ts'
import type { GroupFixView, NewGroupDialogView } from './group-fix-dialogs.tsx'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { SignedInUntilCookie } from '../../auth/session.server.ts'
import { disconnectedBanner } from '../../domain/drive-account.ts'
import {
  checkIssueName,
  closedToast,
  closeWarningText,
  createdToast,
  duplicateNameMessage,
  FINISH_UNAVAILABLE_TOAST,
  finishedToast,
  type IssueFilter,
  issueFilterSearch,
  notConnectedToast,
  parseIssueFilter,
  reopenedToast,
  suggestNextName,
} from '../../domain/issue.ts'
import {
  type ArticleState,
  articleState,
  articleStateTag,
  authorsLine,
  documentUrl,
  type FinalVersion,
  lacksConsent,
  type ReplacedVersion,
  STATE_ORDER,
  whoOf,
} from '../../domain/article.ts'
import {
  ALREADY_CANCELLED_TOAST,
  alreadyHandedOverToast,
  alreadyProofreadingToast,
  CANCEL_FAILED_TOAST,
  cancelTooLateToast,
  closedCancelToast,
  closedHandOverToast,
  HAND_OVER_FAILED_TOAST,
  HANDED_OVER_TOAST,
  HANDOVER_CANCELLED_TOAST,
  MISSING_ADDRESS_ARTICLES_TEXT,
  missingAddressTitle,
  type RaceToast,
  TO_SETTINGS_LABEL,
} from '../../domain/handover.ts'
import {
  APPROVAL_SEND_JOB,
  CLAUSE_JOB_LINK_LABEL,
  CLAUSE_REVIEW_LINK_LABEL,
  clauseRowTag,
  isResendable as isClauseResendable,
  RESEND_NOTHING_TOAST,
  resendClosedToast,
  resendLabel,
  resentClausesToast,
} from '../../domain/approvals.ts'
import { type JobHealth, jobHealth, jobState } from '../../domain/job-run.ts'
import { PRINT_HANDOFF_JOB, printLine } from '../../domain/print-handoff.ts'
import { tied } from '../../domain/public/typography.ts'
import { UNDO_LABEL } from '../../domain/review.ts'
import {
  articleArtworksLine,
  type ArtworkFilter,
  artworkFilterOf,
  type ArtworkState,
  batchState,
  batchStateDetail,
  canDiscardBatch,
  compareArtworks,
  DISCARD_APPROVED_TOAST,
  DISCARD_VERIFIED_TOAST,
  discardedToast,
  driveFileUrl,
  isAwaitingConsent,
  isMailError,
  isRequestSent,
  NO_ARTWORKS,
  RESEND_DAILY_CAP_TOAST,
  RESEND_DISCONNECTED_TOAST,
  RESEND_PDF_GONE_TOAST,
  RESEND_REFUSED_TOAST,
  RESEND_UNAVAILABLE_TOAST,
  resentToast,
  shownSource,
  totalOf,
} from '../../domain/artwork.ts'
import {
  type ArticleFolderKind,
  canDiscard,
  canResend,
  CHECK_UNAVAILABLE_TOAST,
  checkedToast,
  missingFoldersHeading,
  missingFoldersLines,
  RESEND_FOLDER_GONE_TOAST,
  type SubfolderKind,
} from '../../domain/article-folders.ts'
import { folderUrl, type Issue, issueState } from '../../domain/issue.ts'
import {
  binnedFilesCallout,
  canRemove,
  canRename,
  type FixCallout,
  type IssueContents,
  foreignFilesCallout,
  missingFoldersCallout,
  movedFolderCallout,
  REMOVE_DISCONNECTED,
  REMOVE_RACE_ARTICLE_TOAST,
  REMOVE_RACE_GROUP_TOAST,
  REMOVE_UNAVAILABLE,
  removedToast,
  REMOVED_ALREADY_TOAST,
  RENAME_DISCONNECTED,
  RENAME_ISSUE_FOLDER_MISSING,
  RENAME_UNAVAILABLE,
  renameArticlesFolderMissing,
  renameClosedToast,
  RENAMED_MEANWHILE_TOAST,
  RENAMED_TOAST,
} from '../../domain/issue-fixes.ts'
import { issueFolderHeading, issueFolderText, shownIssueMark } from '../../domain/issue-folders.ts'
import {
  absoluteUrl,
  articleLinkPath,
  artworksLinkPath,
  RENEWED_TOAST,
  shareText,
  shownUrl,
  usageLine,
} from '../../domain/link.ts'
import { clockTime, formatMoment, now, parseStamp, stamp } from '../../domain/time.ts'
import type {
  Article,
  ArticleRow,
  HandoverOutcome,
  MissingFolders,
  ReplaceFinalOutcome,
} from '../../data/articles.server.ts'
import type { BatchRow, ListedBatch } from '../../data/artworks.server.ts'
import type { DriveAccessToken } from '../../drive/access-token.server.ts'
import {
  type ArticleFolderIds,
  checkArticleFolders,
  recordedMissing,
} from '../../drive/article-folders.server.ts'
import { checkIssueFolders, recordedIssueMissing } from '../../drive/issue-folders.server.ts'
import { discardBatch, holderOf, resendBatch } from '../../drive/artworks-setup.server.ts'
import { checkAllDocRevisions, type DocChecks } from '../../drive/doc-revisions.server.ts'
import {
  cancelFinalVersion,
  replaceFinalVersion,
  type ReplaceFinalStepOutcome,
} from '../../drive/final-version.server.ts'
import {
  agreedWithLine,
  ALL_APPROVED_TOAST,
  alreadyReplacedToast,
  isReplaceable,
  MARK_REVISED_LABEL,
  markRevisedButtonLabel,
  NEW_FINAL_SAVED_TOAST,
  REPLACE_DIALOG_MAIL,
  REPLACE_FINAL_CONFIRM_LABEL,
  REPLACE_FINAL_DIALOG_TITLE,
  REPLACED_CLAUSES_LABEL,
  replaceDialogCancel,
  replaceDialogEarlier,
  replacedClauseTag,
  replacedMarkedLine,
  replacedPdfHint,
  replacedSummary,
  restoredToast,
  REVISED_CALLOUT_TITLE,
  REVISED_DIALOG_CANCEL,
  REVISED_DIALOG_MAIL,
  revisedAnnouncement,
  revisedCalloutText,
  revisedDialogConsents,
  revisedRestoredToast,
} from '../../domain/final-version-replacement.ts'
import {
  CANCEL_FINAL_FAILED_TOAST,
  cancelFinalRefusalToast,
  DIALOG_CANCEL_LABEL,
  FINAL_ALREADY_CANCELLED_TOAST,
  FINAL_CANCELLED_TOAST,
  finalDialogError,
  markFinalDialogText,
  markFinalRefusalToast,
  MARKING_FINAL_LABEL,
  signaturesLabel,
} from '../../domain/proofreading-queue.ts'
import type { FinalVersionDialogProps } from '../../ui/final-version-dialog/component.tsx'
import {
  createIssue,
  finishIssue,
  removeIssue,
  renameIssue,
} from '../../drive/issue-setup.server.ts'
import { createGroup, groupSetupOf } from '../../drive/group-setup.server.ts'
import { GROUP_CREATED_TOAST, groupCountText, groupNoteLine } from '../../domain/artwork-group.ts'
import { Articles, type ArticlesContext } from '../../middleware/articles.server.ts'
import { type Person, requireEditor } from '../../middleware/auth.server.ts'
import { DriveAccount } from '../../middleware/drive-account.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import {
  type ArticleRowView,
  type ArtworkRowView,
  type ArtworksView,
  type ClausesView,
  DetailPage,
  type DiscardView,
  type DocCheckView,
  type GroupsView,
  type IssueMissingView,
  type LinkBlockView,
  type MissingAddressView,
  type MissingFoldersView,
  type PrintSectionView,
  type ReplacedVersionView,
} from './detail-page.tsx'
import {
  type IssueStepDialogView,
  newGroupHref,
  type ReturnTo,
  stepBackHref,
} from './issue-parts.tsx'
import type { NewIssueDialog } from './overview-page.tsx'
import {
  driveView,
  flashIssueFixed,
  IN_THE_WAY,
  issuesOf,
  type PageContext,
  REFUSED,
  renderOverview,
  takeIssueFixed,
} from './render.tsx'

function formText(context: PageContext, name: string): string {
  let value = (context.get(FormData) as FormData).get(name)
  return typeof value === 'string' ? value : ''
}

/*
 * Which issue's folder _Dokončit vydání_ found gone, for the Callout of the detail it redirects
 * to (`12i`). Kept by name, so it is shown on that issue's detail only, and taken once.
 */
const FOLDER_GONE_SESSION_KEY = 'issueFolderGone'

function flashFolderGone(session: Session | undefined, name: string): void {
  session?.flash(FOLDER_GONE_SESSION_KEY, name)
}

function takeFolderGone(session: Session | undefined, name: string): boolean {
  let value = session?.get(FOLDER_GONE_SESSION_KEY)
  if (value === undefined) return false
  session?.unset(FOLDER_GONE_SESSION_KEY)
  return value === name
}

/*
 * Which issue's link is fresh or renewed, so the detail it redirects to highlights the block and
 * focuses _Kopírovat_ until the next load (`12c`, `02d`). By name, and taken once.
 */
const LINK_CHANGED_SESSION_KEY = 'issueLinkChanged'

/*
 * The artwork group just created, so the detail it redirects to puts it first, highlighted, with
 * focus on its _Kopírovat_ until the next load (`12e`). By its ID, and taken once.
 */
const GROUP_CHANGED_SESSION_KEY = 'artworkGroupChanged'

function flashGroupChanged(session: Session | undefined, groupId: number): void {
  session?.flash(GROUP_CHANGED_SESSION_KEY, String(groupId))
}

function takeGroupChanged(session: Session | undefined): number | null {
  let value = session?.get(GROUP_CHANGED_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(GROUP_CHANGED_SESSION_KEY)
  let id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

function flashLinkChanged(session: Session | undefined, name: string): void {
  session?.flash(LINK_CHANGED_SESSION_KEY, name)
}

function takeLinkChanged(session: Session | undefined, name: string): boolean {
  let value = session?.get(LINK_CHANGED_SESSION_KEY)
  if (value === undefined) return false
  session?.unset(LINK_CHANGED_SESSION_KEY)
  return value === name
}

/*
 * The article just handed over or back, kept for one load at the place its previous state gave
 * it, so the next row's button does not move under the hand (`12l`, as `13b`'s settled card). By
 * the article's ID, with that state and its handover's time, and taken once.
 */
const SETTLED_SESSION_KEY = 'handoverSettled'

type SettledArticle = { at: string | null; id: number; state: ArticleState }

function flashSettled(context: PageContext, settled: SettledArticle): void {
  ;(context.get(Session) as Session | undefined)?.flash(SETTLED_SESSION_KEY, settled)
}

/*
 * What the detail's own revision check just found, for the reload it starts (`12q`): the issue,
 * so it shows on that detail only, and the articles that turned _Upraveno po schválení_, which
 * that one load keeps in place, tinted, with the sentence for a screen reader. Taken once; its
 * presence also tells the reload not to ask Drive again.
 */
const DOC_CHECKED_SESSION_KEY = 'docRevisionsChecked'

type DocChecked = { name: string; revised: readonly number[] }

function flashDocChecked(session: Session | undefined, checked: DocChecked): void {
  session?.flash(DOC_CHECKED_SESSION_KEY, checked)
}

function takeDocChecked(session: Session | undefined, name: string): DocChecked | null {
  let value = session?.get(DOC_CHECKED_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(DOC_CHECKED_SESSION_KEY)
  if (typeof value !== 'object' || value === null) return null
  let { name: checkedName, revised } = value as Record<string, unknown>
  if (checkedName !== name || !Array.isArray(revised)) return null
  return { name, revised: revised.filter((id): id is number => Number.isSafeInteger(id)) }
}

function takeSettled(session: Session | undefined): SettledArticle | null {
  let value = session?.get(SETTLED_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(SETTLED_SESSION_KEY)
  if (typeof value !== 'object' || value === null) return null
  let { at, id, state } = value as Record<string, unknown>
  if (typeof id !== 'number' || (state !== 'writing' && state !== 'handedOver')) return null
  return { at: typeof at === 'string' ? at : null, id, state }
}

function articlesOf(context: PageContext): ArticlesContext {
  return context.get(Articles) as ArticlesContext
}

/** The subfolders' addresses on Drive, for the names in a missing folder's step (`12j`). */
function subfolderUrls(
  article: Pick<ArticleRow, 'artworksFolderId' | 'licencesFolderId'>,
): MissingFoldersView['urls'] {
  let urls: Partial<Record<SubfolderKind, string>> = {}
  if (article.artworksFolderId !== null) urls.artworks = folderUrl(article.artworksFolderId)
  if (article.licencesFolderId !== null) urls.licences = folderUrl(article.licencesFolderId)
  return urls
}

/** A batch in _Chyba_ that _Poslat žádost znovu_ would send, were its folders there. */
function isResendable(batch: BatchRow): boolean {
  return isMailError(batch) && batch.mailRefusedAt === null
}

/** An article or a group, as far as its missing folders and its Callout go (`12j`). */
type FoldersHolder = ArticleFolderIds & { missing: MissingFolders }

/**
 * The Callout under an article's row or in a group's, or `null` while all three folders are there
 * (`12j`).
 */
function missingView(
  issue: Issue,
  holder: FoldersHolder,
  batches: readonly BatchRow[],
): MissingFoldersView | null {
  /* With the issue folder in the bin, its one Callout stands for every folder in it (`12j`). */
  if (issue.missing.issue !== null) return null
  let missing = recordedMissing(holder)
  if (missing.length === 0) return null
  let foundAt = missing
    .map((kind) => holder.missing[kind])
    .filter((at): at is Temporal.Instant => at !== null)
    .reduce((first, at) => (Temporal.Instant.compare(at, first) < 0 ? at : first))
  let ofHolder = batches.filter((batch) =>
    holder.kind === 'group' ? batch.groupId === holder.id : batch.articleId === holder.id,
  )
  let hasBatchToResend = ofHolder.some(isResendable)
  /* A closed issue's replies are read by nobody (`12h`), so nothing records its consents. */
  let hasBatchAwaitingConsent = issue.closedAt === null && ofHolder.some(isAwaitingConsent)
  let ids = { id: String(holder.id), name: issue.name }
  return {
    arrivalCheck: routes.issues.checkMarkedFolders.href({ name: issue.name }),
    /* A closed issue's detail is for reading (`12h`); its records stand as they are. */
    checkAction:
      issue.closedAt !== null
        ? null
        : holder.kind === 'group'
          ? routes.issues.checkGroupFolders.href(ids)
          : routes.issues.checkArticleFolders.href(ids),
    heading: missingFoldersHeading(missing, holder.kind),
    text: missingFoldersLines({
      foundAt,
      hasBatchAwaitingConsent,
      hasBatchToResend,
      holder: holder.kind,
      missing,
    }).join(' '),
    urls: subfolderUrls(holder),
  }
}

/**
 * The issue, its articles and its groups that have a folder on record as missing, asked again
 * after the detail stands: the record goes for a folder that is back (`12j`). An article's or a
 * group's mark asks after the issue's folders too, because its folder is missing also when the
 * whole issue folder is in the bin, and the bin shows only that one, which the detail then names
 * instead. Without an account or an answer from Drive, the records stand as they are.
 */
async function recheckMissing(context: PageContext, issue: Issue): Promise<void> {
  let { articles, artworks } = articlesOf(context)
  let isMarked = (holder: Pick<FoldersHolder, 'missing'>) => recordedMissing(holder).length > 0
  let marked: ArticleFolderIds[] = [
    ...(await articles.listCreated(issue.id))
      .filter(isMarked)
      .map((article) => ({ ...article, kind: 'article' as const })),
    ...(await artworks.groups.listByIssue(issue.id))
      .filter(isMarked)
      .map((group) => ({ ...group, kind: 'group' as const })),
  ]
  let isIssueMarked = recordedIssueMissing(issue).length > 0
  if (marked.length === 0 && !isIssueMarked) return
  let token = await artworks.token()
  if (!token.ok) return
  let folders = artworks.folders(token.accessToken)
  await checkIssueFolders({ folders, issues: issuesOf(context).store, now }, issue)
  let deps = { articles, folders, groups: artworks.groups, now }
  for (let holder of marked) await checkArticleFolders(deps, holder)
}

/**
 * The toast of a _Zkontrolovat znovu_ that got no token for Drive (`12j`): the account's own step
 * where it is not connected or was disconnected, the check's where Drive did not answer.
 */
function flashTokenFailure(
  context: Parameters<typeof flashToast>[0],
  token: Extract<DriveAccessToken, { ok: false }>,
  expectedEmail: string,
): void {
  if (token.reason === 'not-connected')
    flashToast(context, notConnectedToast(expectedEmail), 'error')
  else if (token.reason === 'disconnected')
    flashToast(context, disconnectedBanner(expectedEmail), 'error')
  else flashToast(context, CHECK_UNAVAILABLE_TOAST, 'error')
}

/** The Callout under the header while the issue's `Články` or its own folder is missing. */
function issueMissingView(issue: Issue): IssueMissingView | null {
  let mark = shownIssueMark(issue)
  if (mark === null) return null
  return {
    arrivalCheck: routes.issues.checkMarkedFolders.href({ name: issue.name }),
    checkAction:
      issue.closedAt === null ? routes.issues.checkIssueFolders.href({ name: issue.name }) : null,
    heading: issueFolderHeading(mark.kind, issue.name),
    text: issueFolderText(mark.kind, mark.at),
  }
}

/**
 * The Docs of the issue's approved articles, asked whether they were edited after their PDF
 * (#101, `01a`), once the detail stands (`12q`): what Drive said is recorded and the rows read it.
 * Only an open issue, and without an account or an answer the records stand as they are.
 */
async function recheckDocRevisions(context: PageContext, issue: Issue): Promise<DocChecks> {
  let nothing: DocChecks = { moved: [], revised: [] }
  if (issue.closedAt !== null) return nothing
  let { articles, artworks } = articlesOf(context)
  let targets = await articles.listDocCheckTargets(issue.id)
  if (targets.length === 0) return nothing
  let token = await artworks.token()
  if (!token.ok) return nothing
  return checkAllDocRevisions({ articles, files: artworks.files(token.accessToken) }, targets)
}

/** The block for the link and the rows of _Články_, from what the database has (`12a`). */
/**
 * The open row of an article with a final version (`12b`, `12q`): each author's clause, who
 * marked the version and when, the names the clauses carry, and _Poslat žádost znovu_ while a
 * clause is one it would send again and the issue is open.
 */
function clausesView(
  issue: Issue,
  article: Article & { finalVersion: FinalVersion },
  replaced: readonly ReplacedVersion[],
  health: JobHealth,
  filter: ArtworkFilter,
  today: Temporal.Instant,
): ClausesView {
  let { finalVersion } = article
  let ids = { id: String(article.id), name: issue.name }
  let recipients = finalVersion.authors.filter((clause) => isClauseResendable(clause.state)).length
  let marked = encodeURIComponent(stamp(finalVersion.at))
  let revisedAt = articleState(article) === 'revised' ? finalVersion.docRevisedAt : null
  return {
    authors: finalVersion.authors.map((clause) => {
      let rowTag = clauseRowTag(clause, health, today)
      /* Under _Upraveno po schválení_ a consent names its version, not its time (`12b`). */
      let tag =
        revisedAt !== null && clause.state === 'approved'
          ? { ...rowTag, detail: agreedWithLine(finalVersion.at, today) }
          : rowTag
      return {
        email: clause.authorEmail,
        error: tag.error,
        link:
          tag.link === 'review'
            ? {
                href: `${routes.review.index.href()}#reply-clause-${clause.id}`,
                label: CLAUSE_REVIEW_LINK_LABEL,
              }
            : tag.link === 'jobs'
              ? {
                  href: routes.settings.jobs.show.href({ job: APPROVAL_SEND_JOB }),
                  label: CLAUSE_JOB_LINK_LABEL,
                }
              : null,
        name: clause.authorName,
        quote: tag.quote,
        tag: { detail: tag.detail ?? undefined, label: tag.label, tone: tag.tone },
      }
    }),
    documentUrl: documentUrl(article.docId),
    markedLine: tied`Finální verze z ${formatMoment(finalVersion.at, today)} · Označení: ${whoOf(finalVersion)}`,
    names: finalVersion.authors.map((clause) => clause.signature),
    namesLabel: signaturesLabel(finalVersion.authors.length),
    pdfUrl: driveFileUrl(finalVersion.pdfFileId),
    replaced: replaced.map((version) => replacedVersionView(version, today)),
    revised:
      revisedAt === null
        ? null
        : {
            text: revisedCalloutText(revisedAt, finalVersion.at, today),
            title: REVISED_CALLOUT_TITLE,
          },
    resend:
      issue.closedAt === null && recipients > 0
        ? {
            action: `${routes.issues.resendClauses.href(ids)}?marked=${marked}${filter === 'all' ? '' : `&artworks=${filter}`}`,
            label: resendLabel(recipients, finalVersion.authors.length),
          }
        : null,
  }
}

/** A replaced marking under the one that stands (`12s`): a record, with its own PDF. */
function replacedVersionView(
  version: ReplacedVersion,
  today: Temporal.Instant,
): ReplacedVersionView {
  return {
    authors: version.authors.map((clause) => {
      let tag = replacedClauseTag(clause, today)
      return {
        detail: tag.detail,
        email: clause.authorEmail,
        label: tag.label,
        name: clause.authorName,
        quote: tag.quote,
      }
    }),
    clausesLabel: REPLACED_CLAUSES_LABEL,
    markedLine: replacedMarkedLine(version, today),
    pdfHint: replacedPdfHint(version.at, today),
    pdfUrl: driveFileUrl(version.pdfFileId),
    summary: replacedSummary(version.at, today),
  }
}

async function linkAndArticles(
  context: PageContext,
  issue: Issue,
  isChanged: boolean,
  settled: SettledArticle | null,
  justRevised: ReadonlySet<number>,
): Promise<{ articles: ArticleRowView[]; link: LinkBlockView | undefined }> {
  let { articles, artworks, links, origin } = articlesOf(context)
  let isOpen = issue.closedAt === null
  let today = now()
  let created = await articles.listCreated(issue.id)
  let counts = await artworks.artworks.countsByArticle(issue.id)
  let artworksLinks = await links.artworksLinksOf(issue.id)
  let batches = await artworks.artworks.listByIssue(issue.id)
  let filter = filterOf(context)
  let openId = Number(context.url.searchParams.get('article'))
  let health = jobHealth(await articlesOf(context).runs.latest(APPROVAL_SEND_JOB), today)
  /* Only the open row shows the replaced versions, so only its are read. */
  let replaced = Number.isSafeInteger(openId) ? await articles.replacedVersions(openId) : []
  let rows = created.map((article) => {
    let articleCounts = counts.get(article.id) ?? NO_ARTWORKS
    let artworksLink = artworksLinks.get(article.id)
    let state = articleState(article)
    let ids = { id: String(article.id), name: issue.name }
    /* A settled row stands where its previous state put it until the next load (`12l`), and
       so does a row the detail's own check just found revised, tinted (`12q`). */
    let isSettled = settled?.id === article.id
    let isJustRevised = justRevised.has(article.id) && state === 'revised'
    let sortState =
      isSettled && settled !== null ? settled.state : isJustRevised ? 'approved' : state
    let sortAt =
      isSettled && settled !== null
        ? parseStamp(settled.at)
        : state === 'handedOver'
          ? (article.handover?.at ?? null)
          : null
    let finalVersion = article.finalVersion
    /* The tag opens the row and closes it again, through the address, so it works with no
       script and survives the redirect of _Poslat žádost znovu_; one row is open at a time. */
    let isRowOpen = finalVersion !== null && openId === article.id
    return {
      clauses:
        isRowOpen && finalVersion !== null
          ? clausesView(issue, { ...article, finalVersion }, replaced, health, filter, today)
          : null,
      isOpen: isRowOpen,
      showReplyHref:
        finalVersion !== null && state === 'review' && !isRowOpen
          ? detailHref(issue, filter, article.id)
          : null,
      stateHref:
        finalVersion === null
          ? null
          : isRowOpen
            ? detailHref(issue, filter)
            : detailHref(issue, filter, article.id),
      cancelFinalAction:
        isOpen && finalVersion !== null && finalVersion.isCancellable
          ? `${routes.issues.cancelFinalVersion.href(ids)}?marked=${encodeURIComponent(stamp(finalVersion.at))}`
          : null,
      /* `12q`: the row's one step out of _Upraveno po schválení_, the dialog of `12r`. */
      markRevised:
        isOpen && finalVersion !== null && state === 'revised'
          ? {
              accessibleLabel: markRevisedButtonLabel(article.name),
              href: `${routes.issues.askReplaceFinalVersion.href(ids)}?marked=${encodeURIComponent(stamp(finalVersion.at))}${filter === 'all' ? '' : `&artworks=${filter}`}`,
              label: MARK_REVISED_LABEL,
            }
          : null,
      replaceFinalAction:
        isOpen && finalVersion !== null && isReplaceable(finalVersion)
          ? `${routes.issues.askReplaceFinalVersion.href(ids)}?marked=${encodeURIComponent(stamp(finalVersion.at))}${filter === 'all' ? '' : `&artworks=${filter}`}`
          : null,
      cancelHandoverAction:
        isOpen && state === 'handedOver' ? routes.issues.cancelHandover.href(ids) : null,
      fixes: {
        editAuthorsHref: canEditAuthors(article, isOpen)
          ? withFilter(routes.issues.askEditAuthors.href(ids), filter)
          : null,
        removeHref: canRemoveArticle(state, totalOf(articleCounts), isOpen)
          ? withFilter(routes.issues.askRemoveArticle.href(ids), filter)
          : null,
        renameHref: canRenameArticle(article, isOpen)
          ? withFilter(routes.issues.askRenameArticle.href(ids), filter)
          : null,
      },
      handOverAction: isOpen && state === 'writing' ? routes.issues.handOver.href(ids) : null,
      isChanged: isJustRevised,
      sortAt,
      sortState,
      artworks: { count: totalOf(articleCounts), line: articleArtworksLine(articleCounts) },
      /* A closed issue's link answers `02f`, so it is not handed out (`12h`). */
      artworksUrl:
        artworksLink === undefined || !isOpen
          ? null
          : absoluteUrl(origin, artworksLinkPath(artworksLink.key)),
      authors: authorsLine(article.authors),
      documentUrl: documentUrl(article.docId),
      id: article.id,
      missing: missingView(issue, { ...article, kind: 'article' }, batches),
      name: article.name,
      pdfUrl: finalVersion === null ? null : driveFileUrl(finalVersion.pdfFileId),
      state: articleStateTag(article),
    }
  })
  /* An article with something waiting, among its artworks or a missing folder, stands with what
     waits (`12a`, `12j`); then by state, the oldest handover first among the handed over, so the
     one waiting since Monday leads them on Friday (`12k`). The sort is stable, so the rest keep
     the newest first. */
  let isWaitingRow = (row: ArticleRowView) =>
    Number(
      (row.artworks.line?.isWaiting ?? false) ||
        row.missing !== null ||
        (!row.isChanged && (row.state.tone === 'problem' || row.state.tone === 'waiting')),
    )
  rows.sort(
    (a, b) =>
      isWaitingRow(b) - isWaitingRow(a) ||
      STATE_ORDER[a.sortState] - STATE_ORDER[b.sortState] ||
      (a.sortAt !== null && b.sortAt !== null ? Temporal.Instant.compare(a.sortAt, b.sortAt) : 0),
  )

  let link = issue.completedAt === null ? null : await links.articleLinkOf(issue.id)
  if (link === null) return { articles: rows, link: undefined }
  let url = absoluteUrl(origin, articleLinkPath(link.key))
  return {
    articles: rows,
    link: {
      isChanged,
      isClosed: !isOpen,
      openHref: articleLinkPath(link.key),
      renewHref: routes.issues.askRenewLink.href({ name: issue.name }),
      shareText: shareText(issue.name, url),
      shown: shownUrl(url),
      url,
      usage: usageLine(await links.usage(link.id), today),
    },
  }
}

/**
 * The address of the detail with the artworks' filter, as `12a` keeps it, and the article whose
 * row is open (`12b`), scrolled to.
 */
function detailHref(issue: Issue, filter: ArtworkFilter, openArticle?: number): string {
  let query = new URLSearchParams()
  if (filter !== 'all') query.set('artworks', filter)
  if (openArticle !== undefined) query.set('article', String(openArticle))
  let href = routes.issues.show.href({ name: issue.name })
  let search = query.size === 0 ? '' : `?${query}`
  return openArticle === undefined ? `${href}${search}` : `${href}${search}#article-${openArticle}`
}

/** _Obrazová díla_ of the issue: every artwork of its live batches, filtered and in order. */
async function artworksOf(
  context: PageContext,
  issue: Issue,
  filter: ArtworkFilter,
): Promise<ArtworksView> {
  let { articles, artworks } = articlesOf(context)
  let batches = await artworks.artworks.listByIssue(issue.id)
  let missingOf = new Map<string, ArticleFolderKind[]>([
    ...(await articles.listCreated(issue.id)).map(
      (article) => [`article:${article.id}`, recordedMissing(article)] as const,
    ),
    ...(await artworks.groups.listByIssue(issue.id)).map(
      (group) => [`group:${group.id}`, recordedMissing(group)] as const,
    ),
  ])
  let isOpen = issue.closedAt === null
  let all: (ArtworkRowView & { uploadedAt: Temporal.Instant })[] = batches.flatMap((batch) => {
    let state: ArtworkState = batchState(batch)
    let missing = missingOf.get(`${batch.holder.kind}:${batch.holder.id}`) ?? []
    let query = filter === 'all' ? '' : `?artworks=${filter}`
    let ids = { id: String(batch.id), name: issue.name }
    /* _Poslat žádost znovu_ only while the request never went; _Zahodit dávku_ also once it did,
       until the batch is approved or its consent recorded (`12u`). */
    let discardHref =
      isOpen && canDiscardBatch(batch) && canDiscard(missing)
        ? `${routes.issues.askDiscardBatch.href(ids)}${query}`
        : null
    let resendAction =
      isOpen && isMailError(batch) && canResend(missing)
        ? `${routes.issues.resendBatch.href(ids)}${query}`
        : null
    let actions =
      discardHref === null && resendAction === null
        ? null
        : { count: batch.artworks.length, discardHref, resendAction }
    return batch.artworks.map((artwork) => ({
      author: artwork.author ?? 'neuveden',
      batchActions: actions,
      driveUrl: driveFileUrl(artwork.driveFileId),
      holderName: batch.holder.name,
      id: artwork.id,
      name: artwork.originalName,
      providerEmail: batch.providerEmail,
      providerName: batch.providerName,
      source:
        artwork.source === null
          ? null
          : { href: artwork.source, shown: shownSource(artwork.source) },
      state,
      stateDetail: batchStateDetail(batch),
      uploadedAt: artwork.uploadedAt,
    }))
  })
  all.sort(compareArtworks)
  let counts: Record<ArtworkFilter, number> = {
    all: all.length,
    approved: 0,
    error: 0,
    provider: 0,
    review: 0,
  }
  for (let row of all) counts[row.state] += 1
  return {
    counts,
    filter,
    hrefOf: (value) => detailHref(issue, value),
    rows: filter === 'all' ? all : all.filter((row) => row.state === filter),
  }
}

function filterOf(context: PageContext): ArtworkFilter {
  return artworkFilterOf(context.url.searchParams.get('artworks'))
}

/** The overview's filter, which `/issues/new` carries in its address as `/` does (`11a`). */
function overviewFilterOf(context: PageContext): IssueFilter {
  return parseIssueFilter(context.url.searchParams.get('state'))
}

/**
 * _Skupiny obrazových děl_ (`12a`, `12c`, `12h`): every group of a complete issue, the newest
 * first, with _Nová skupina_ while the issue is active. An unfinished issue has none (`01a`).
 */
async function groupsOf(
  context: PageContext,
  issue: Issue,
  changed: { id: number | null; isHeadingFocused: boolean },
): Promise<GroupsView | undefined> {
  let state = issueState(issue)
  if (state === 'unfinished') return undefined
  let { artworks, origin } = articlesOf(context)
  let groups = await artworks.groups.listByIssue(issue.id)
  let batches = await artworks.artworks.listByIssue(issue.id)
  let filter = filterOf(context)
  let isOpen = issue.closedAt === null
  return {
    isHeadingFocused: changed.isHeadingFocused,
    newHref: state === 'active' ? newGroupHref(issue, 'detail') : null,
    rows: groups.map((group) => {
      let url = group.link === null ? null : absoluteUrl(origin, artworksLinkPath(group.link.key))
      let ids = { id: String(group.id), name: issue.name }
      return {
        count: groupCountText(group.artworks),
        fixes: {
          editHref: canEditGroup(isOpen)
            ? withFilter(routes.issues.askEditGroup.href(ids), filter)
            : null,
          removeHref: canRemoveGroup(group.artworks, isOpen)
            ? withFilter(routes.issues.askRemoveGroup.href(ids), filter)
            : null,
        },
        /* A missing folder has nothing to open (`12j`); a missing `Obrazová díla` or `Licence`
           leaves the group's own folder where it is. */
        folderHref:
          group.folderId === null || group.missing.article !== null
            ? null
            : folderUrl(group.folderId),
        id: group.id,
        isChanged: group.id === changed.id,
        isClosed: state === 'closed',
        isCopyFocused: group.id === changed.id && !changed.isHeadingFocused,
        missing: missingView(issue, { ...group, kind: 'group' }, batches),
        name: group.name,
        noteLine: group.note === '' ? null : groupNoteLine(group.note),
        shown: url === null ? null : shownUrl(url),
        url,
      }
    }),
  }
}

async function renderDetail(
  context: PageContext & { auth: { identity: Person } },
  issue: Issue,
  options: {
    discarding?: DiscardView
    fixing?: ArticleFixView
    groupFixing?: GroupFixView
    isFolderGone?: boolean
    isRenewing?: boolean
    /** The detail itself, which asks Drive about approved texts once it stands (`12q`). */
    isShown?: boolean
    newGroup?: NewGroupDialogView
    replacing?: FinalVersionDialogProps
    status?: number
    step?: IssueStepDialogView
  } = {},
): Promise<Response> {
  let session = context.get(Session) as Session | undefined
  let fixed = takeIssueFixed(context)
  let checked = takeDocChecked(session, issue.name)
  let { articles, link } = await linkAndArticles(
    context,
    issue,
    takeLinkChanged(session, issue.name),
    takeSettled(session),
    new Set(checked?.revised ?? []),
  )
  return context.render(
    <DetailPage
      articles={articles}
      missingAddress={await missingAddressOf(context, articles)}
      artworks={await artworksOf(context, issue, filterOf(context))}
      discarding={options.discarding}
      docCheck={await docCheckOf(context, issue, articles, checked, options.isShown ?? false)}
      fixing={options.fixing}
      driveAccount={await driveView(context)}
      groupFixing={options.groupFixing}
      groups={await groupsOf(context, issue, {
        id: takeGroupChanged(session),
        isHeadingFocused: fixed?.focus === 'groups' && fixed.issueId === issue.id,
      })}
      isFolderGone={options.isFolderGone}
      isRenewing={options.isRenewing}
      isTitleFocused={fixed?.focus === 'title' && fixed.issueId === issue.id}
      isArticlesFocused={fixed?.focus === 'articles' && fixed.issueId === issue.id}
      issue={issue}
      issueMissing={issueMissingView(issue)}
      link={link}
      newGroup={options.newGroup}
      person={context.auth.identity}
      print={await printOf(context, issue)}
      replacing={options.replacing}
      step={options.step}
      toasts={context.get(Toasts) as readonly ToastMessage[]}
    />,
    options.status === undefined ? undefined : { status: options.status },
  )
}

/**
 * The detail's own revision check (`12q`) on an open issue: the sentence for a screen reader on
 * the load that shows what it found, and the check itself only on the detail as opened. A
 * dialog's page and the check's own reload ask nothing, nor an issue with no approved text. Its
 * key is new on every render, so a later load of the detail asks again.
 */
async function docCheckOf(
  context: PageContext,
  issue: Issue,
  rows: readonly ArticleRowView[],
  checked: DocChecked | null,
  isShown: boolean,
): Promise<DocCheckView | null> {
  if (issue.closedAt !== null) return null
  let revised = rows.filter((row) => row.isChanged).length
  let canCheck =
    isShown &&
    checked === null &&
    (await articlesOf(context).articles.listDocCheckTargets(issue.id)).length > 0
  return {
    announcement: revised === 0 ? null : revisedAnnouncement(revised),
    check: canCheck
      ? {
          href: routes.issues.checkDocRevisions.href({ name: issue.name }),
          key: crypto.randomUUID(),
        }
      : null,
  }
}

/**
 * _Podklady pro tisk_ (`12t`), on an active issue with a print folder: unfinished and closed issues
 * have none, the job skips a closed one, so its count would stand still (`12h`).
 */
async function printOf(context: PageContext, issue: Issue): Promise<PrintSectionView | undefined> {
  let folderId = issue.folderIds.print
  if (issueState(issue) !== 'active' || folderId === null) return undefined
  let { printHandoffs, runs } = articlesOf(context)
  let today = now()
  let state = jobState(await runs.latest(PRINT_HANDOFF_JOB), today)
  return {
    folderHref: folderUrl(folderId),
    jobHref: routes.settings.jobs.show.href({ job: PRINT_HANDOFF_JOB }),
    line: printLine(await printHandoffs.summaryOf(issue.id), state, today),
  }
}

/**
 * The warning over _Články_ while the proofreaders have no address and something here waits for
 * them (`12l`): before the first handover it would warn of nothing.
 */
async function missingAddressOf(
  context: PageContext & { auth: { identity: Person } },
  rows: readonly ArticleRowView[],
): Promise<MissingAddressView | undefined> {
  if (!rows.some((row) => row.cancelHandoverAction !== null)) return undefined
  if ((await articlesOf(context).proofreaders.find()) !== null) return undefined
  let isAdmin = context.auth.identity.isAdmin
  return {
    action: isAdmin
      ? { href: `${routes.settings.index.href()}#proofreading`, label: TO_SETTINGS_LABEL }
      : undefined,
    text: MISSING_ADDRESS_ARTICLES_TEXT,
    title: missingAddressTitle(isAdmin),
  }
}

/** A created article of this issue, or `null`: an ID from another issue answers as unknown. */
async function articleOf(context: PageContext, issue: Issue, id: string): Promise<Article | null> {
  let articleId = Number(id)
  if (!Number.isSafeInteger(articleId)) return null
  let created = await articlesOf(context).articles.listCreated(issue.id)
  return created.find((each) => each.id === articleId) ?? null
}

/** `?artworks=` kept on the address of a dialog over the detail. */
function withFilter(href: string, filter: ArtworkFilter): string {
  return filter === 'all' ? href : `${href}?artworks=${filter}`
}

/** A committed group of this issue that is not removed, by the ID in the address. */
async function groupOf(context: PageContext, issue: Issue, id: string): Promise<GroupRow | null> {
  let groupId = Number(id)
  if (!Number.isSafeInteger(groupId)) return null
  let group = await articlesOf(context).artworks.groups.findById(groupId)
  if (group === null || group.issueId !== issue.id || group.createdAt === null) return null
  return group.removedAt === null ? group : null
}

/** Whether the group in the address was this issue's and is removed now (`12f`). */
async function isRemovedGroup(context: PageContext, issue: Issue, id: string): Promise<boolean> {
  let group = await articlesOf(context).artworks.groups.findById(Number(id))
  return group?.issueId === issue.id && group.removedAt !== null
}

/** What the fixes of a group need: the group store, the article store for its folder marks, Drive. */
function groupFixSetupOf(context: PageContext): GroupFixSetup {
  let { articles, artworks, setup } = articlesOf(context)
  return {
    articles,
    files: issuesOf(context).setup.files,
    folders: setup.folders,
    groups: artworks.groups,
    issues: setup.issues,
    now: setup.now,
    token: setup.token,
  }
}

/** The dialog of `12f` over the detail, with the fields as typed and what it showed. */
function editGroupViewOf(
  issue: Issue,
  group: GroupRow,
  filter: ArtworkFilter,
  extra: {
    callout?: FixCallout
    errors?: { name: string | null; note: string | null }
    shown?: { name: string; note: string }
    values?: { name: string; note: string }
  },
): GroupFixView {
  let ids = { id: String(group.id), name: issue.name }
  let shown = extra.shown ?? { name: group.name, note: group.note }
  return {
    action: withFilter(routes.issues.editGroup.href(ids), filter),
    cancelHref: detailHref(issue, filter),
    currentName: group.name,
    errors: extra.errors ?? { name: null, note: null },
    kind: 'edit',
    shownName: shown.name,
    shownNote: shown.note,
    values: extra.values ?? { name: group.name, note: group.note },
    ...(extra.callout === undefined ? {} : { callout: extra.callout }),
  }
}

/** The removal dialog of `12f` over the detail, with what it says about the discarded batches. */
async function removeGroupViewOf(
  context: PageContext,
  issue: Issue,
  group: GroupRow,
  callout?: FixCallout,
): Promise<GroupFixView> {
  let filter = filterOf(context)
  let ids = { id: String(group.id), name: issue.name }
  let discarded = await articlesOf(context).artworks.artworks.discardedOf({
    articleId: null,
    groupId: group.id,
  })
  return {
    action: withFilter(routes.issues.removeGroup.href(ids), filter),
    cancelHref: detailHref(issue, filter),
    kind: 'remove',
    paragraphs: removeGroupDialogText(discarded),
    title: removeGroupTitle(group.name),
    ...(callout === undefined ? {} : { callout }),
  }
}

/** What the fixes of an article need: the article's setup and the issue's files on Drive. */
function articleFixSetupOf(context: PageContext): ArticleFixSetup {
  return { ...articlesOf(context).setup, files: issuesOf(context).setup.files }
}

/** The dialog of `12x` over the detail, with the name in the field and the one it showed. */
function renameViewOf(
  issue: Issue,
  article: Article,
  filter: ArtworkFilter,
  extra: { callout?: FixCallout; fieldError?: string; name: string; shownName?: string },
): ArticleFixView {
  let ids = { id: String(article.id), name: issue.name }
  return {
    action: withFilter(routes.issues.renameArticle.href(ids), filter),
    cancelHref: detailHref(issue, filter),
    kind: 'rename',
    shownName: extra.shownName ?? article.name,
    ...(extra.callout === undefined ? {} : { callout: extra.callout }),
    ...(extra.fieldError === undefined ? {} : { fieldError: extra.fieldError }),
    name: extra.name,
  }
}

/** The dialog of `12z` over the detail, with what it says about the discarded batches. */
async function removeViewOf(
  context: PageContext,
  issue: Issue,
  article: Article,
  callout?: FixCallout,
): Promise<ArticleFixView> {
  let filter = filterOf(context)
  let ids = { id: String(article.id), name: issue.name }
  let discarded = await articlesOf(context).artworks.artworks.discardedOf({ articleId: article.id })
  let state: 'handedOver' | 'writing' =
    articleState(article) === 'handedOver' ? 'handedOver' : 'writing'
  return {
    action: withFilter(routes.issues.removeArticle.href(ids), filter),
    cancelHref: detailHref(issue, filter),
    kind: 'remove',
    paragraphs: removeArticleDialogText(
      article.name,
      state,
      article.missing.article !== null,
      discarded,
    ),
    ...(callout === undefined ? {} : { callout }),
  }
}

/** Cards to type into, numbered in their order: before the final version, every author's. */
function editableCards(authors: readonly { email: string; name: string }[]): AuthorCardView[] {
  return authors.map((author, index) => ({
    email: author.email,
    key: index + 1,
    kind: 'editable',
    name: author.name,
    number: index + 1,
  }))
}

/**
 * The cards as the article stands: every author before the final version; after it, an agreed
 * author as text with the tag of `12b`, and every other one to type into, keyed by its clause,
 * whose ID the form carries.
 */
function storedCards(article: Article): AuthorCardView[] {
  let finalVersion = article.finalVersion
  if (finalVersion === null) return editableCards(article.authors)
  let today = now()
  return finalVersion.authors.map((clause): AuthorCardView => {
    if (isAgreed(clause.state)) {
      let at = clause.approvedAt ?? clause.replyReceivedAt
      return {
        agreed: { detail: at === null ? null : formatMoment(at, today), label: AGREED_AUTHOR_TAG },
        email: clause.authorEmail,
        key: clause.id,
        kind: 'agreed',
        name: clause.authorName,
        number: clause.position,
      }
    }
    return {
      email: clause.authorEmail,
      hidden: { name: 'clause', value: String(clause.id) },
      key: clause.id,
      kind: 'editable',
      name: clause.authorName,
      number: clause.position,
    }
  })
}

/** The dialog of `12y` over the detail, with the cards as typed or as stored. */
function authorsViewOf(
  issue: Issue,
  article: Article,
  filter: ArtworkFilter,
  cards: AuthorCardView[],
  extra: { callout?: FixCallout; errors?: readonly FieldError[] },
): ArticleFixView {
  let ids = { id: String(article.id), name: issue.name }
  let finalVersion = article.finalVersion
  let hasFinal = finalVersion !== null
  return {
    action: withFilter(routes.issues.editAuthors.href(ids), filter),
    callout: extra.callout ?? null,
    cancelHref: detailHref(issue, filter),
    cards,
    confirmLabel: SAVE_AUTHORS_LABEL,
    errors: extra.errors ?? [],
    hidden: [{ name: 'marked', value: finalVersion === null ? '' : stamp(finalVersion.at) }],
    isFinal: hasFinal,
    kind: 'authors',
    lead: editAuthorsLead(article.name, hasFinal),
    note: editAuthorsNote(hasFinal),
    pendingLabel: SAVE_AUTHORS_PENDING_LABEL,
  }
}

/** The Callout in the dialog for a refusal on Drive or of the account; `null` for any other. */
function authorsCalloutOf(outcome: EditAuthorsFixOutcome): FixCallout | null {
  switch (outcome.kind) {
    case 'folder-missing':
      return AUTHORS_FOLDER_MISSING
    case 'meta-binned':
      return authorsMetaBinned(driveFileUrl(outcome.fileId))
    case 'not-connected':
    case 'disconnected':
      return AUTHORS_DISCONNECTED
    case 'doc-missing':
    case 'unavailable':
      return AUTHORS_UNAVAILABLE
    default:
      return null
  }
}

/** What somebody else did meanwhile, as `12l` says it: nothing changed, so no _Vrátit_. */
function flashRace(
  context: { get(key: typeof Session): Session | undefined },
  toast: RaceToast,
): void {
  flashToast(context, toast.message, 'neutral', undefined, toast.detail)
}

/** The undo's stamp from the address, or `null` for a step that is not one. */
function undoOf(context: PageContext): Temporal.Instant | null {
  return parseStamp(context.url.searchParams.get('undo'))
}

/** The question _Zahodit dávku_ over the detail, keeping the artworks' filter (`12o`). */
function discardingView(context: PageContext, issue: Issue, batch: ListedBatch): DiscardView {
  let filter = filterOf(context)
  return {
    action: `${routes.issues.discardBatch.href({ id: String(batch.id), name: issue.name })}${filter === 'all' ? '' : `?artworks=${filter}`}`,
    cancelHref: detailHref(issue, filter),
    count: batch.artworks.length,
    email: batch.providerEmail,
    holder: { kind: batch.holder.kind, name: batch.holder.name },
    isRequestSent: isRequestSent(batch),
  }
}

/** A live batch of this issue, or `null`: an ID from another issue answers as unknown. */
async function batchOf(context: PageContext, issue: Issue, id: string) {
  let batchId = Number(id)
  if (!Number.isSafeInteger(batchId)) return null
  let batches = await articlesOf(context).artworks.artworks.listByIssue(issue.id)
  return batches.find((batch) => batch.id === batchId) ?? null
}

/**
 * The dialog of `12r` over the detail, for the marking the row showed. The names are the
 * article's authors as they are now, whom the new clauses go to.
 */
function replaceDialogOf(
  context: PageContext,
  issue: Issue,
  article: Article,
  markedAt: Temporal.Instant,
  error: FinalVersionDialogProps['error'],
): FinalVersionDialogProps {
  let today = now()
  let filter = filterOf(context)
  let names = article.authors.map((author) => author.name)
  /* After _Upraveno po schválení_ every request was answered by a consent, so the dialog says
     where the consents stay instead of which requests stop counting (`12q`). */
  let isRevised = articleState(article) === 'revised'
  return {
    action: `${routes.issues.replaceFinalVersion.href({ id: String(article.id), name: issue.name })}?marked=${encodeURIComponent(stamp(markedAt))}${filter === 'all' ? '' : `&artworks=${filter}`}`,
    after: isRevised
      ? [revisedDialogConsents(markedAt, today), REVISED_DIALOG_CANCEL]
      : [replaceDialogEarlier(markedAt, today), replaceDialogCancel(markedAt, today)],
    cancel: { href: detailHref(issue, filter), label: DIALOG_CANCEL_LABEL },
    confirmLabel: REPLACE_FINAL_CONFIRM_LABEL,
    error,
    lead: [
      markFinalDialogText(article.name),
      isRevised ? REVISED_DIALOG_MAIL : REPLACE_DIALOG_MAIL,
    ],
    pendingLabel: MARKING_FINAL_LABEL,
    signatures: { label: signaturesLabel(names.length), names },
    title: REPLACE_FINAL_DIALOG_TITLE,
  }
}

/** Why a new version wrote nothing, for the toast; `null` for an article that is gone. */
function replaceRefusalToast(
  refusal: Exclude<ReplaceFinalOutcome, { kind: 'done' }>,
): RaceToast | null {
  switch (refusal.kind) {
    case 'replaced':
      return alreadyReplacedToast(refusal.step, now())
    case 'not-final':
      return { message: FINAL_ALREADY_CANCELLED_TOAST }
    case 'all-approved':
      return { message: ALL_APPROVED_TOAST }
    case 'closed':
      return markFinalRefusalToast({ issueName: refusal.issueName, kind: 'closed' }, now())
    case 'gone':
      return null
  }
}

/**
 * What the warning of _Uzavřít vydání_ counts (`12g`): the articles whose authors have not all
 * agreed, and the artworks of the batches still without consent, discarded ones aside.
 */
async function missingConsentOf(
  context: PageContext,
  issue: Issue,
): Promise<{ articles: number; artworks: number }> {
  let { articles, artworks } = articlesOf(context)
  let [created, batches] = await Promise.all([
    articles.listCreated(issue.id),
    artworks.artworks.listByIssue(issue.id),
  ])
  return {
    articles: created.filter((article) => lacksConsent(articleState(article))).length,
    artworks: batches
      .filter((batch) => batchState(batch) !== 'approved')
      .reduce((sum, batch) => sum + batch.artworks.length, 0),
  }
}

/** Where a dialog of `12g`, `12h` was asked from: `?from=overview` and its filter, or the detail. */
function askedFrom(context: PageContext): { filter: IssueFilter; returnTo: ReturnTo } {
  let isOverview = context.url.searchParams.get('from') === 'overview'
  return {
    filter: isOverview ? overviewFilterOf(context) : 'all',
    returnTo: isOverview ? 'overview' : 'detail',
  }
}

/** The same, from the dialog's form. */
function answeredFrom(context: PageContext): { filter: IssueFilter; returnTo: ReturnTo } {
  let isOverview = formText(context, 'returnTo') === 'overview'
  return {
    filter: isOverview ? parseIssueFilter(formText(context, 'state')) : 'all',
    returnTo: isOverview ? 'overview' : 'detail',
  }
}

/** The dialog over the page it was asked from; a refused answer with its status. */
function renderStep(
  context: PageContext & { auth: { identity: Person } },
  step: IssueStepDialogView,
  status?: number,
): Promise<Response> {
  return step.returnTo === 'overview'
    ? renderOverview(
        context,
        context.auth.identity,
        step.filter,
        step,
        status === undefined ? undefined : { status },
      )
    : renderDetail(context, step.issue, { status, step })
}

/** What the issue holds, as its row counts it: created articles and created groups (`12u`). */
async function contentsOf(context: PageContext, issue: Issue): Promise<IssueContents> {
  let { articles, artworks } = articlesOf(context)
  let [created, groups] = await Promise.all([
    articles.listCreated(issue.id),
    artworks.groups.listByIssue(issue.id),
  ])
  return { articles: created.length, groups: groups.length }
}

/**
 * The dialog _Nová skupina obrazových děl_ with what it was sent (`12e`), over the page it was
 * asked from: the detail, or the overview and its filter from a row's „⋯“ (`11a`).
 */
function newGroupDialog(
  issue: Issue,
  from: { filter: IssueFilter; returnTo: ReturnTo },
  state: Omit<NewGroupDialogView, 'action' | 'cancelHref' | 'from'>,
): NewGroupDialogView {
  return {
    ...state,
    action: routes.issues.createGroup.href({ name: issue.name }),
    cancelHref: stepBackHref(issue, from.returnTo, from.filter),
    from,
  }
}

/** The dialog over the page it was asked from; a refused answer with its status. */
function renderNewGroup(
  context: PageContext & { auth: { identity: Person } },
  issue: Issue,
  group: NewGroupDialogView,
  status?: number,
): Promise<Response> {
  return group.from.returnTo === 'overview'
    ? renderOverview(
        context,
        context.auth.identity,
        group.from.filter,
        { group, kind: 'new-group' },
        status === undefined ? undefined : { status },
      )
    : renderDetail(context, issue, { newGroup: group, status })
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

/** `/issues/…`: the dialog _Nové vydání_ (`11d`), the detail (`12a`, `12c`, `12i`), finishing. */
export default function createIssuesController(signedInUntil: SignedInUntilCookie) {
  return createController(routes.issues, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      async new(context) {
        let names = (await issuesOf(context).store.list()).map((issue) => issue.name)
        return renderOverview(context, context.auth.identity, overviewFilterOf(context), {
          kind: 'form',
          name: suggestNextName(names, now()),
        })
      },

      async create(context) {
        let editor = context.auth.identity
        let filter = overviewFilterOf(context)
        let typed = formText(context, 'name')
        let form = (extra: Partial<Extract<NewIssueDialog, { kind: 'form' }>>) =>
          ({ kind: 'form', name: typed, ...extra }) as const

        let checked = checkIssueName(typed)
        if (!checked.ok) {
          return renderOverview(context, editor, filter, form({ fieldError: checked.message }), {
            status: REFUSED,
          })
        }

        let outcome = await createIssue(issuesOf(context).setup, checked.name, editor)
        switch (outcome.kind) {
          case 'created':
            flashToast(context, createdToast(outcome.issue.name))
            flashLinkChanged(context.get(Session), outcome.issue.name)
            return redirect(routes.issues.show.href({ name: outcome.issue.name }), 303)
          case 'duplicate':
            return renderOverview(
              context,
              editor,
              filter,
              form({ fieldError: duplicateNameMessage(outcome.existingName) }),
              { status: REFUSED },
            )
          case 'unfinished':
            return renderOverview(
              context,
              editor,
              filter,
              { issue: outcome.issue, kind: 'unfinished' },
              { status: IN_THE_WAY },
            )
          case 'unavailable':
            return renderOverview(context, editor, filter, form({ isDriveUnavailable: true }), {
              status: IN_THE_WAY,
            })
          /* The dialog already says it from the moment it opens; the answer says it again with
             the field kept (`14g`). */
          case 'not-connected':
          case 'disconnected':
            return renderOverview(context, editor, filter, form({}), { status: IN_THE_WAY })
        }
      },

      async show(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()

        /* No Drive call before the page: the folders on record as missing and the approved
           texts are asked once it stands, by `checkMarkedFolders` (`12j`) and
           `checkDocRevisions` (`12q`). Only this page asks, never one with a dialog over it. */
        return renderDetail(context, issue, {
          isFolderGone: takeFolderGone(context.get(Session), issue.name),
          isShown: true,
        })
      },

      /* `12q`: what the detail asks once it stands. What changed is recorded and flashed for
         the reload the page's island starts, and the answer lists the articles whose rows
         change, so the island knows what to wait for. No toast and no redirect, as
         `checkMarkedFolders`. */
      async checkDocRevisions(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        let found = await recheckDocRevisions(context, issue)
        let changed = [...found.revised, ...found.moved]
        if (changed.length > 0) {
          flashDocChecked(context.get(Session) as Session | undefined, {
            name: issue.name,
            revised: found.revised,
          })
        }
        return Response.json({ changed })
      },

      /* `12j`: what the detail's Callouts ask once the page stands. The records change and the
         Callouts read them on the page's next render, so this says nothing: no toast, whether
         Drive answered or not, and never a redirect, because the page's island fetches it and
         reloads the page itself. */
      async checkMarkedFolders(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        await recheckMissing(context, issue)
        return new Response(null, { status: 204 })
      },

      /* `12j`: every folder of the article asked again, then back to the detail with what came
         of it. */
      async checkArticleFolders(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        let { articles, artworks } = articlesOf(context)
        let articleId = Number(context.params.id)
        let article = Number.isSafeInteger(articleId)
          ? ((await articles.listCreated(issue.id)).find((each) => each.id === articleId) ?? null)
          : null
        if (article === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)

        let token = await artworks.token()
        if (!token.ok) {
          flashTokenFailure(context, token, context.get(DriveAccount).expectedEmail)
          return back()
        }
        let checked = recordedMissing(article)
        let check = await checkArticleFolders(
          { articles, folders: artworks.folders(token.accessToken), now },
          { ...article, kind: 'article' },
        )
        if (check === 'unavailable') {
          flashToast(context, CHECK_UNAVAILABLE_TOAST, 'error')
          return back()
        }
        let toast = checkedToast(checked, check.missing)
        flashToast(context, toast.text, toast.tone === 'error' ? 'error' : undefined)
        return back()
      },

      /* `12j`: every folder of the group asked again, then back to the detail with what came of
         it, as under an article. */
      async checkGroupFolders(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        let { articles, artworks } = articlesOf(context)
        let groupId = Number(context.params.id)
        let group = Number.isSafeInteger(groupId)
          ? ((await artworks.groups.listByIssue(issue.id)).find((each) => each.id === groupId) ??
            null)
          : null
        if (group === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)

        let token = await artworks.token()
        if (!token.ok) {
          flashTokenFailure(context, token, context.get(DriveAccount).expectedEmail)
          return back()
        }
        let checked = recordedMissing(group)
        let check = await checkArticleFolders(
          { articles, folders: artworks.folders(token.accessToken), groups: artworks.groups, now },
          { ...group, kind: 'group' },
        )
        if (check === 'unavailable') {
          flashToast(context, CHECK_UNAVAILABLE_TOAST, 'error')
          return back()
        }
        let toast = checkedToast(checked, check.missing)
        flashToast(context, toast.text, toast.tone === 'error' ? 'error' : undefined)
        return back()
      },

      /* `12j`: the issue's folders asked again, then back to the detail with what came of it.
         The detail's own check then takes the marks of the articles' folders that came back with
         the issue folder. */
      async checkIssueFolders(context) {
        let { store } = issuesOf(context)
        let issue = await store.findByName(context.params.name)
        if (issue === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)

        let token = await articlesOf(context).artworks.token()
        if (!token.ok) {
          flashTokenFailure(context, token, context.get(DriveAccount).expectedEmail)
          return back()
        }
        /* The toast speaks of the folder the Callout named, never of one it kept quiet about. */
        let shown = shownIssueMark(issue)
        let checked = shown === null ? [] : [shown.kind]
        let check = await checkIssueFolders(
          { folders: articlesOf(context).artworks.folders(token.accessToken), issues: store, now },
          issue,
        )
        if (check === 'unavailable') {
          flashToast(context, CHECK_UNAVAILABLE_TOAST, 'error')
          return back()
        }
        let toast = checkedToast(checked, check.missing)
        flashToast(context, toast.text, toast.tone === 'error' ? 'error' : undefined)
        return back()
      },

      /*
       * `12g`: the dialog, with the warning while something still lacks consent. An issue closed
       * meanwhile goes back to the page, which shows it closed; an unfinished one cannot be.
       */
      async askClose(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null) return notFound()
        let from = askedFrom(context)
        if (issue.closedAt !== null) {
          return redirect(stepBackHref(issue, from.returnTo, from.filter), 303)
        }
        let counts = await missingConsentOf(context, issue)
        return renderStep(context, {
          ...from,
          issue,
          kind: 'close',
          warning: closeWarningText(counts.articles, counts.artworks),
        })
      },

      /*
       * The state alone: the links and the jobs read it (`12g`). Nothing on Drive, the print
       * folder's sharing included (`03` row 8), and the Registr follows through the record queue.
       * A second answer to a dialog drawn twice changes nothing and says nothing.
       */
      async close(context) {
        let { store } = issuesOf(context)
        let issue = await store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null) return notFound()
        let from = answeredFrom(context)
        if (await store.close(issue.id, now())) flashToast(context, closedToast(issue.name))
        return redirect(stepBackHref(issue, from.returnTo, from.filter), 303)
      },

      async askReopen(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null) return notFound()
        let from = askedFrom(context)
        if (issue.closedAt === null) {
          return redirect(stepBackHref(issue, from.returnTo, from.filter), 303)
        }
        return renderStep(context, { ...from, issue, kind: 'reopen', warning: null })
      },

      /* `12h`: the same keys work again, so the links in the newsroom's conversations do too. */
      async reopen(context) {
        let { store } = issuesOf(context)
        let issue = await store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null) return notFound()
        let from = answeredFrom(context)
        if (await store.reopen(issue.id)) flashToast(context, reopenedToast(issue.name))
        return redirect(stepBackHref(issue, from.returnTo, from.filter), 303)
      },

      /* `12v`: the dialog with the name in the field, for an issue that is not closed. */
      async askRename(context) {
        let { hasRegistry, store } = issuesOf(context)
        let issue = await store.findByName(context.params.name)
        if (issue === null) return notFound()
        let from = askedFrom(context)
        if (!canRename(issue)) return redirect(stepBackHref(issue, from.returnTo, from.filter), 303)
        return renderStep(context, {
          ...from,
          hasRegistry,
          issue,
          kind: 'rename',
          name: issue.name,
          warning: null,
        })
      },

      /*
       * `12v`: by the ID the form carries, so somebody else's rename meanwhile is answered with
       * what holds now rather than with a 404. A refusal the editor can mend comes back in the
       * dialog with the name as typed; a race closes it with a toast.
       */
      async rename(context) {
        let { hasRegistry, setup, store } = issuesOf(context)
        let id = Number(formText(context, 'id'))
        let issue = Number.isSafeInteger(id) ? await store.findById(id) : null
        if (issue === null) return notFound()
        let from = answeredFrom(context)
        let back = (current: Issue) => stepBackHref(current, from.returnTo, from.filter)
        if (issue.removedAt !== null) {
          flashToast(context, REMOVED_ALREADY_TOAST)
          return redirect(stepBackHref(issue, 'overview', from.filter), 303)
        }
        let shownName = formText(context, 'shownName')
        if (issue.name !== shownName) {
          flashToast(context, RENAMED_MEANWHILE_TOAST)
          return redirect(routes.issues.show.href({ name: issue.name }), 303)
        }

        let typed = formText(context, 'name')
        let dialog = (extra: { callout?: FixCallout; fieldError?: string }, status: number) =>
          renderStep(
            context,
            { ...from, ...extra, hasRegistry, issue, kind: 'rename', name: typed, warning: null },
            status,
          )
        let checked = checkIssueName(typed)
        if (!checked.ok) return dialog({ fieldError: checked.message }, REFUSED)

        let outcome = await renameIssue(setup, { id, name: checked.name, shownName })
        switch (outcome.kind) {
          case 'renamed':
            flashToast(context, RENAMED_TOAST)
            if (from.returnTo === 'overview') {
              flashIssueFixed(context, { focus: 'row', issueId: outcome.issue.id })
            } else {
              flashIssueFixed(context, { focus: 'title', issueId: outcome.issue.id })
            }
            return redirect(back(outcome.issue), 303)
          case 'unchanged':
            return redirect(back(issue), 303)
          case 'duplicate':
            return dialog({ fieldError: duplicateNameMessage(outcome.existingName) }, REFUSED)
          case 'closed':
            flashToast(context, renameClosedToast(outcome.issue.name))
            return redirect(back(outcome.issue), 303)
          case 'renamed-meanwhile':
            flashToast(context, RENAMED_MEANWHILE_TOAST)
            return redirect(routes.issues.show.href({ name: outcome.issue.name }), 303)
          case 'removed':
            flashToast(context, REMOVED_ALREADY_TOAST)
            return redirect(stepBackHref(issue, 'overview', from.filter), 303)
          case 'issue-folder-missing':
            return dialog({ callout: RENAME_ISSUE_FOLDER_MISSING }, IN_THE_WAY)
          case 'articles-folder-missing':
            return dialog({ callout: renameArticlesFolderMissing(outcome.name) }, IN_THE_WAY)
          case 'folders-missing': {
            let named = (each: { fileId: string; name: string }) => ({
              href: folderUrl(each.fileId),
              name: each.name,
            })
            let callout = missingFoldersCallout(
              outcome.articles.map(named),
              outcome.groups.map(named),
            )
            return dialog({ callout }, IN_THE_WAY)
          }
          case 'files-binned': {
            let callout = binnedFilesCallout(
              outcome.files.map((file) => ({
                href: driveFileUrl(file.fileId),
                kind: file.holder,
                name: file.name,
              })),
            )
            return dialog({ callout }, IN_THE_WAY)
          }
          case 'not-connected':
          case 'disconnected':
            return dialog({ callout: RENAME_DISCONNECTED }, IN_THE_WAY)
          case 'unavailable':
            return dialog({ callout: RENAME_UNAVAILABLE }, IN_THE_WAY)
        }
      },

      /* `12w`: the dialog, for an issue with no article and no group. */
      async askRemove(context) {
        let { hasRegistry, store } = issuesOf(context)
        let issue = await store.findByName(context.params.name)
        if (issue === null) return notFound()
        let from = askedFrom(context)
        if (!canRemove(await contentsOf(context, issue))) {
          return redirect(stepBackHref(issue, from.returnTo, from.filter), 303)
        }
        return renderStep(context, { ...from, hasRegistry, issue, kind: 'remove', warning: null })
      },

      /*
       * `12w`: always back to the overview, since the detail is gone with the issue. An article or
       * a group that came meanwhile leaves the issue as it was and opens its detail.
       */
      async remove(context) {
        let { hasRegistry, setup, store } = issuesOf(context)
        let id = Number(formText(context, 'id'))
        let issue = Number.isSafeInteger(id) ? await store.findById(id) : null
        if (issue === null) return notFound()
        let from = answeredFrom(context)
        let overview = stepBackHref(issue, 'overview', from.filter)
        let dialog = (callout: FixCallout) =>
          renderStep(
            context,
            { ...from, callout, hasRegistry, issue, kind: 'remove', warning: null },
            IN_THE_WAY,
          )

        let outcome = await removeIssue(setup, { id })
        switch (outcome.kind) {
          case 'removed':
            flashToast(context, removedToast(outcome.issue.name))
            flashIssueFixed(context, { focus: 'heading' })
            return redirect(overview, 303)
          case 'already-removed':
            flashToast(context, REMOVED_ALREADY_TOAST)
            return redirect(overview, 303)
          case 'has-article':
          case 'has-group':
            flashToast(
              context,
              outcome.kind === 'has-article' ? REMOVE_RACE_ARTICLE_TOAST : REMOVE_RACE_GROUP_TOAST,
            )
            return redirect(routes.issues.show.href({ name: outcome.issue.name }), 303)
          case 'moved':
            return dialog(movedFolderCallout(folderUrl(outcome.folderId)))
          case 'foreign':
            return dialog(
              foreignFilesCallout(
                outcome.files.map((file) => ({
                  folderName: file.folderName,
                  href: file.isFolder ? folderUrl(file.id) : driveFileUrl(file.id),
                  name: file.name,
                })),
              ),
            )
          case 'not-connected':
          case 'disconnected':
            return dialog(REMOVE_DISCONNECTED)
          case 'unavailable':
            return dialog(REMOVE_UNAVAILABLE)
        }
      },

      async newGroup(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issueState(issue) !== 'active') return notFound()
        return renderNewGroup(
          context,
          issue,
          newGroupDialog(issue, askedFrom(context), {
            errors: { name: null, note: null },
            formKey: crypto.randomUUID(),
            refusal: null,
            values: { name: '', note: '' },
          }),
        )
      },

      async createGroup(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issueState(issue) !== 'active') return notFound()
        let editor = context.auth.identity
        let values = { name: formText(context, 'name'), note: formText(context, 'note') }
        let typedKey = formText(context, 'formKey')
        let formKey = /^[0-9a-f-]{36}$/.test(typedKey) ? typedKey : crypto.randomUUID()
        let from = answeredFrom(context)
        let again = (
          errors: NewGroupDialogView['errors'],
          refusal: NewGroupDialogView['refusal'],
          status: number,
        ) =>
          renderNewGroup(
            context,
            issue,
            newGroupDialog(issue, from, { errors, formKey, refusal, values }),
            status,
          )

        let { artworks, setup } = articlesOf(context)
        let outcome = await createGroup(groupSetupOf(setup, artworks), {
          ...values,
          formKey,
          issueId: issue.id,
          startedBy: { email: editor.email, name: editor.displayName },
        })
        switch (outcome.kind) {
          case 'created':
            flashToast(context, GROUP_CREATED_TOAST)
            flashGroupChanged(context.get(Session), outcome.group.id)
            return redirect(routes.issues.show.href({ name: issue.name }), 303)
          case 'invalid':
            return again(outcome.errors, null, REFUSED)
          case 'not-active':
            return notFound()
          case 'unavailable':
          case 'disconnected':
          case 'not-connected':
            return again({ name: null, note: null }, outcome.kind, IN_THE_WAY)
        }
      },

      async askRenewLink(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null || issue.closedAt !== null)
          return notFound()
        return renderDetail(context, issue, { isRenewing: true })
      },

      /* `02d`: the old key answers `02e` from this moment, and the new one starts from nothing. */
      /*
       * `12q`: _Zrušit finální verzi_ from the row's „⋯“, of the marking the row showed
       * (`?marked=`), while no run of the job has taken a clause. Without a _Vrátit_, as in the
       * queue: marking again goes through the dialog (`15g`).
       */
      async cancelFinalVersion(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        let markedAt = parseStamp(context.url.searchParams.get('marked'))
        if (issue === null || article === null || markedAt === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let outcome = await cancelFinalVersion(articlesOf(context).artworks, {
          id: article.id,
          markedAt,
        })
        if (outcome.kind === 'done') {
          /* A new version gives way to the one it replaced, not to the proofreading (`12s`); one
             every author agreed to comes back with its consents (`12q`). */
          let restored = outcome.restored
          let after = restored === null ? null : await articleOf(context, issue, context.params.id)
          flashToast(
            context,
            restored === null
              ? FINAL_CANCELLED_TOAST
              : after !== null && articleState(after) === 'revised'
                ? revisedRestoredToast(restored, now())
                : restoredToast(restored, now()),
          )
          return back()
        }
        if (outcome.kind === 'unavailable') {
          flashToast(context, CANCEL_FINAL_FAILED_TOAST, 'error')
          return back()
        }
        if (outcome.refusal.kind === 'gone') return notFound()
        flashRace(context, cancelFinalRefusalToast(outcome.refusal, now()))
        return back()
      },

      /*
       * `12r`: the dialog of a new version over the detail, for the marking the row showed
       * (`?marked=`). A row that no longer offers the step answers with the reason, as the step
       * itself would.
       */
      async askReplaceFinalVersion(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        let markedAt = parseStamp(context.url.searchParams.get('marked'))
        if (issue === null || article === null || markedAt === null) return notFound()
        let refusal = await articlesOf(context).articles.checkReplaceFinalVersion(
          article.id,
          markedAt,
        )
        if (refusal !== null) {
          let toast = replaceRefusalToast(refusal)
          if (toast === null) return notFound()
          flashRace(context, toast)
          return redirect(detailHref(issue, filterOf(context)), 303)
        }
        return renderDetail(context, issue, {
          replacing: replaceDialogOf(context, issue, article, markedAt, null),
        })
      },

      /*
       * `12r`, `12s`: the new PDF and clauses in place of the marking the row showed. What Drive
       * stops stays in the dialog to be tried again; what somebody changed meanwhile reloads the
       * detail with the reason. The toast's _Vrátit_ cancels the new version, while it may.
       */
      async replaceFinalVersion(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        let markedAt = parseStamp(context.url.searchParams.get('marked'))
        if (issue === null || article === null || markedAt === null) return notFound()
        let editor = context.auth.identity
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let outcome: ReplaceFinalStepOutcome = await replaceFinalVersion(
          articlesOf(context).artworks,
          {
            by: { email: editor.email, name: editor.displayName || null },
            id: article.id,
            markedAt,
          },
        )
        switch (outcome.kind) {
          case 'done': {
            let ids = { id: String(article.id), name: issue.name }
            flashToast(context, NEW_FINAL_SAVED_TOAST, 'neutral', {
              action: `${routes.issues.cancelFinalVersion.href(ids)}?marked=${encodeURIComponent(stamp(outcome.at))}`,
              label: UNDO_LABEL,
            })
            return back()
          }
          case 'refused': {
            let toast = replaceRefusalToast(outcome.refusal)
            if (toast === null) return notFound()
            flashRace(context, toast)
            return back()
          }
          case 'account':
          case 'doc-missing':
          case 'folder-missing':
          case 'unavailable':
            return renderDetail(context, issue, {
              replacing: replaceDialogOf(
                context,
                issue,
                article,
                markedAt,
                finalDialogError(outcome.kind, true),
              ),
              status: IN_THE_WAY,
            })
        }
      },

      async resendClauses(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        let markedAt = parseStamp(context.url.searchParams.get('marked'))
        if (issue === null || article === null || markedAt === null) return notFound()
        let outcome = await articlesOf(context).articles.resendClauses(article.id, markedAt)
        if (outcome.kind === 'gone') return notFound()
        if (outcome.kind === 'done') flashToast(context, resentClausesToast(outcome.count))
        else if (outcome.kind === 'closed')
          flashToast(context, resendClosedToast(outcome.issueName))
        else flashToast(context, RESEND_NOTHING_TOAST)
        return redirect(detailHref(issue, filterOf(context), article.id), 303)
      },

      /* `12x`: the dialog with the name in the field, while the article can be renamed. */
      async askRenameArticle(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        if (issue === null || article === null) return notFound()
        let filter = filterOf(context)
        if (!canRenameArticle(article, issue.closedAt === null)) {
          return redirect(detailHref(issue, filter), 303)
        }
        return renderDetail(context, issue, {
          fixing: renameViewOf(issue, article, filter, { name: article.name }),
        })
      },

      /*
       * `12x`: Drive and the row together, or neither. A refusal the editor can mend stays in the
       * dialog with the name as typed; what changed meanwhile reloads the detail with the reason.
       */
      async renameArticle(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        if (issue === null || article === null) return notFound()
        let filter = filterOf(context)
        let back = () => redirect(detailHref(issue, filter), 303)
        let typed = formText(context, 'name')
        let shownName = formText(context, 'shownName')
        let dialog = (extra: { callout?: FixCallout; fieldError?: string }, status: number) =>
          renderDetail(context, issue, {
            fixing: renameViewOf(issue, article, filter, { ...extra, name: typed, shownName }),
            status,
          })
        let checked = checkArticleName(typed)
        if (!checked.ok) return dialog({ fieldError: checked.error.message }, REFUSED)

        let outcome = await renameArticle(articleFixSetupOf(context), {
          id: article.id,
          name: checked.name,
          shownName,
        })
        switch (outcome.kind) {
          case 'renamed':
            flashToast(context, ARTICLE_RENAMED_TOAST)
            flashIssueFixed(context, { focus: 'articles', issueId: issue.id })
            return back()
          case 'unchanged':
            return back()
          case 'renamed-meanwhile':
            flashToast(context, ARTICLE_RENAMED_MEANWHILE_TOAST)
            return back()
          case 'final-version': {
            let toast = renameTooLateToast(outcome.step, now())
            flashToast(context, toast.message, 'neutral', undefined, toast.detail)
            return back()
          }
          case 'closed':
            flashToast(context, articleRenameClosedToast(outcome.issueName))
            return back()
          case 'gone':
            return notFound()
          case 'folder-missing':
            return dialog({ callout: RENAME_ARTICLE_FOLDER_MISSING }, IN_THE_WAY)
          case 'doc-missing':
            return dialog({ callout: RENAME_ARTICLE_DOC_MISSING }, IN_THE_WAY)
          case 'meta-binned':
            return dialog(
              { callout: renameArticleMetaBinned(driveFileUrl(outcome.fileId)) },
              IN_THE_WAY,
            )
          case 'not-connected':
          case 'disconnected':
            return dialog({ callout: RENAME_ARTICLE_DISCONNECTED }, IN_THE_WAY)
          case 'unavailable':
            return dialog({ callout: RENAME_ARTICLE_UNAVAILABLE }, IN_THE_WAY)
        }
      },

      /* `12f`: the dialog with the name and the note in the fields, in an open issue. */
      async askEditGroup(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let group = issue === null ? null : await groupOf(context, issue, context.params.id)
        if (issue === null || group === null) return notFound()
        let filter = filterOf(context)
        if (!canEditGroup(issue.closedAt === null)) return redirect(detailHref(issue, filter), 303)
        return renderDetail(context, issue, {
          groupFixing: editGroupViewOf(issue, group, filter, {}),
        })
      },

      /*
       * `12f`: a note alone in the row; a rename on Drive and in the row together, or neither. A
       * refusal the editor can mend stays in the dialog with the fields as typed; what changed
       * meanwhile reloads the detail with the reason, before any message of a field.
       */
      async editGroup(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        let filter = filterOf(context)
        let back = () => redirect(detailHref(issue, filter), 303)
        let group = await groupOf(context, issue, context.params.id)
        if (group === null) {
          if (!(await isRemovedGroup(context, issue, context.params.id))) return notFound()
          flashToast(context, GROUP_REMOVED_MEANWHILE_TOAST)
          return back()
        }
        let values = { name: formText(context, 'name'), note: formText(context, 'note') }
        let shown = { name: formText(context, 'shownName'), note: formText(context, 'shownNote') }
        let dialog = (extra: Parameters<typeof editGroupViewOf>[3], status: number) =>
          renderDetail(context, issue, {
            groupFixing: editGroupViewOf(issue, group, filter, { ...extra, shown, values }),
            status,
          })

        let outcome = await editGroup(groupFixSetupOf(context), {
          id: group.id,
          ...values,
          shownName: shown.name,
          shownNote: shown.note,
        })
        switch (outcome.kind) {
          case 'saved':
            flashToast(context, outcome.isRenamed ? GROUP_RENAMED_TOAST : GROUP_NOTE_SAVED_TOAST)
            flashGroupChanged(context.get(Session), group.id)
            flashIssueFixed(context, { focus: 'groups', issueId: issue.id })
            return back()
          case 'unchanged':
            return back()
          case 'invalid':
            return dialog({ errors: outcome.errors }, REFUSED)
          case 'changed-meanwhile':
            flashToast(context, GROUP_CHANGED_MEANWHILE_TOAST)
            return back()
          case 'closed':
            flashToast(context, editGroupClosedToast(outcome.issueName))
            return back()
          case 'gone':
            if (!(await isRemovedGroup(context, issue, context.params.id))) return notFound()
            flashToast(context, GROUP_REMOVED_MEANWHILE_TOAST)
            return back()
          case 'folder-missing':
            return dialog({ callout: RENAME_GROUP_FOLDER_MISSING }, IN_THE_WAY)
          case 'meta-binned':
            return dialog(
              { callout: renameGroupMetaBinned(driveFileUrl(outcome.fileId)) },
              IN_THE_WAY,
            )
          case 'not-connected':
          case 'disconnected':
            return dialog({ callout: RENAME_GROUP_DISCONNECTED }, IN_THE_WAY)
          case 'unavailable':
            return dialog({ callout: RENAME_GROUP_UNAVAILABLE }, IN_THE_WAY)
        }
      },

      /* `12f`: the dialog, while the group can be removed. */
      async askRemoveGroup(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let group = issue === null ? null : await groupOf(context, issue, context.params.id)
        if (issue === null || group === null) return notFound()
        let listed = (await articlesOf(context).artworks.groups.listByIssue(issue.id)).find(
          (each) => each.id === group.id,
        )
        if (!canRemoveGroup(listed?.artworks ?? 0, issue.closedAt === null)) {
          return redirect(detailHref(issue, filterOf(context)), 303)
        }
        return renderDetail(context, issue, {
          groupFixing: await removeGroupViewOf(context, issue, group),
        })
      },

      /*
       * `12f`: the row and the folder together, or neither. A refusal on Drive the editor can
       * mend stays in the dialog; what changed meanwhile reloads the detail with the reason.
       */
      async removeGroup(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let group = await groupOf(context, issue, context.params.id)
        if (group === null) {
          /* Removed in another tab: the row's absence says it, so no toast, as for an article. */
          return (await isRemovedGroup(context, issue, context.params.id)) ? back() : notFound()
        }
        let dialog = async (callout: FixCallout) =>
          renderDetail(context, issue, {
            groupFixing: await removeGroupViewOf(context, issue, group, callout),
            status: IN_THE_WAY,
          })

        let outcome = await removeGroup(groupFixSetupOf(context), { id: group.id })
        switch (outcome.kind) {
          case 'removed':
            flashToast(context, GROUP_REMOVED_TOAST)
            flashIssueFixed(context, { focus: 'groups', issueId: issue.id })
            return back()
          case 'already-removed':
          case 'gone':
            return back()
          case 'has-artworks':
            flashToast(context, REMOVE_GROUP_ARTWORKS_TOAST)
            return back()
          case 'closed':
            flashToast(context, removeGroupClosedToast(outcome.issueName))
            return back()
          case 'moved':
            return dialog(movedGroupFolderCallout(folderUrl(outcome.folderId), issue.name))
          case 'foreign':
            return dialog(
              groupForeignFilesCallout(
                outcome.files.map((file) => ({
                  folderName: file.folderName,
                  href: file.isFolder ? folderUrl(file.id) : driveFileUrl(file.id),
                  name: file.name,
                })),
              ),
            )
          case 'not-connected':
          case 'disconnected':
            return dialog(REMOVE_GROUP_DISCONNECTED)
          case 'unavailable':
            return dialog(REMOVE_GROUP_UNAVAILABLE)
        }
      },

      /* `12z`: the dialog, while the article can be removed. */
      async askRemoveArticle(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        if (issue === null || article === null) return notFound()
        let counts = await articlesOf(context).artworks.artworks.countsByArticle(issue.id)
        let liveBatches = totalOf(counts.get(article.id) ?? NO_ARTWORKS)
        if (!canRemoveArticle(articleState(article), liveBatches, issue.closedAt === null)) {
          return redirect(detailHref(issue, filterOf(context)), 303)
        }
        return renderDetail(context, issue, { fixing: await removeViewOf(context, issue, article) })
      },

      /*
       * `12z`: the row and the folder together, or neither. A refusal on Drive the editor can
       * mend stays in the dialog; what changed meanwhile reloads the detail with the reason.
       */
      async removeArticle(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        let filter = filterOf(context)
        let back = () => redirect(detailHref(issue, filter), 303)
        let article = await articleOf(context, issue, context.params.id)
        if (article === null) {
          /* Removed in another tab: the row's absence says it, so no toast. */
          let row = await articlesOf(context).articles.findById(Number(context.params.id))
          return row?.issueId === issue.id && row.removedAt !== null ? back() : notFound()
        }
        let dialog = async (callout: FixCallout) =>
          renderDetail(context, issue, {
            fixing: await removeViewOf(context, issue, article, callout),
            status: IN_THE_WAY,
          })

        let outcome = await removeArticle(articleFixSetupOf(context), { id: article.id })
        switch (outcome.kind) {
          case 'removed':
            flashToast(context, ARTICLE_REMOVED_TOAST)
            flashIssueFixed(context, { focus: 'articles', issueId: issue.id })
            return back()
          case 'already-removed':
          case 'gone':
          case 'too-late':
            return back()
          case 'proofreading': {
            let toast = removeArticleTakenToast(outcome.step)
            flashToast(context, toast.message, 'neutral', undefined, toast.detail)
            return back()
          }
          case 'has-artworks':
            flashToast(context, REMOVE_ARTICLE_ARTWORKS_TOAST)
            return back()
          case 'closed':
            flashToast(context, removeArticleClosedToast(outcome.issueName))
            return back()
          case 'moved':
            return dialog(movedArticleFolderCallout(folderUrl(outcome.folderId), issue.name))
          case 'foreign':
            return dialog(
              articleForeignFilesCallout(
                outcome.files.map((file) => ({
                  folderName: file.folderName,
                  href: file.isFolder ? folderUrl(file.id) : driveFileUrl(file.id),
                  name: file.name,
                })),
              ),
            )
          case 'not-connected':
          case 'disconnected':
            return dialog(REMOVE_ARTICLE_DISCONNECTED)
          case 'unavailable':
            return dialog(REMOVE_ARTICLE_UNAVAILABLE)
        }
      },

      /* `12y`: the cards of the authors as they are, before the final version or after it. */
      async askEditAuthors(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        if (issue === null || article === null) return notFound()
        let filter = filterOf(context)
        if (!canEditAuthors(article, issue.closedAt === null)) {
          return redirect(detailHref(issue, filter), 303)
        }
        return renderDetail(context, issue, {
          fixing: authorsViewOf(issue, article, filter, storedCards(article), {}),
        })
      },

      /*
       * `12y`: the authors on Drive and in the row together, or neither, and only then the
       * welcome. The form carries the marking it showed, so a final version marked, cancelled or
       * replaced meanwhile writes nothing (`15d`).
       */
      async editAuthors(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        if (issue === null || article === null) return notFound()
        let filter = filterOf(context)
        let back = () => redirect(detailHref(issue, filter), 303)
        let data = context.get(FormData) as FormData
        let names = data.getAll(AUTHOR_NAME_FIELD).map(String)
        let emails = data.getAll(AUTHOR_EMAIL_FIELD).map(String)
        let typed = names.map((name, index) => ({ email: emails[index] ?? '', name }))
        let clauseIds = data.getAll('clause').map(Number)
        let marked = formText(context, 'marked')
        let markedAt = marked === '' ? null : parseStamp(marked)
        if (marked !== '' && markedAt === null) return notFound()
        /* After the final version: the stored cards with what was typed into the editable ones. */
        let typedFinalCards = () =>
          storedCards(article).map((card) => {
            let index = card.kind === 'editable' ? clauseIds.indexOf(card.key) : -1
            let entered = index === -1 ? undefined : typed[index]
            return entered === undefined ? card : { ...card, ...entered }
          })
        let dialog = (
          cards: AuthorCardView[],
          extra: { callout?: FixCallout; errors?: readonly FieldError[] },
          status: number,
        ) =>
          renderDetail(context, issue, {
            fixing: authorsViewOf(issue, article, filter, cards, extra),
            status,
          })

        let outcome: EditAuthorsFixOutcome
        let finalVersion = article.finalVersion
        if (markedAt === null) {
          /* Without the runtime, _Přidat autora_ and _Odebrat_ come here and draw the cards again. */
          let intent = formText(context, 'intent')
          let removed = /^remove-(\d+)$/.exec(intent)
          if (intent === 'add-author' || removed !== null) {
            let kept =
              removed === null
                ? typed
                : typed.filter((_, index) => index + 1 !== Number(removed[1]))
            let next = intent === 'add-author' ? [...kept, { email: '', name: '' }] : kept
            return dialog(editableCards(next), {}, 200)
          }
          let check = checkAuthors(typed)
          if (check.errors.length > 0) {
            return dialog(editableCards(check.authors), { errors: check.errors }, REFUSED)
          }
          outcome = await editAuthors(articleFixSetupOf(context), {
            authors: check.authors,
            id: article.id,
            markedAt: null,
          })
        } else {
          let corrections = clauseIds.map((clauseId, index) => ({
            clauseId,
            email: typed[index]?.email ?? '',
            name: typed[index]?.name ?? '',
          }))
          /* The marking the form showed is still the one: the cards are checked against it. A
             change meanwhile is answered by the step itself, which writes nothing. */
          if (finalVersion !== null && finalVersion.at.equals(markedAt)) {
            let byId = new Map(finalVersion.authors.map((clause) => [clause.id, clause]))
            let check = checkAuthors(typed, {
              fixed: finalVersion.authors
                .filter((clause) => isAgreed(clause.state))
                .map((clause) => ({ email: clause.authorEmail, number: clause.position })),
              keepsEmptyCards: true,
              numbers: clauseIds.map((id) => byId.get(id)?.position ?? 0),
            })
            if (check.errors.length > 0) {
              return dialog(typedFinalCards(), { errors: check.errors }, REFUSED)
            }
          }
          outcome = await editAuthors(articleFixSetupOf(context), {
            corrections,
            id: article.id,
            markedAt,
          })
        }

        let callout = authorsCalloutOf(outcome)
        if (callout !== null) {
          let cards = markedAt === null ? editableCards(typed) : typedFinalCards()
          return dialog(cards, { callout }, IN_THE_WAY)
        }
        switch (outcome.kind) {
          case 'saved': {
            let toast = authorsSavedToast(outcome.sent, outcome.failed)
            flashToast(
              context,
              toast.message,
              toast.isError ? 'error' : 'neutral',
              undefined,
              toast.detail,
            )
            flashIssueFixed(context, { focus: 'articles', issueId: issue.id })
            return back()
          }
          case 'corrected': {
            if (outcome.count === 0) {
              flashToast(context, AUTHORS_SAVED_TOAST)
            } else {
              let health = jobHealth(
                await articlesOf(context).runs.latest(APPROVAL_SEND_JOB),
                now(),
              )
              let detail =
                health.kind === 'running' && health.next !== null
                  ? `Další běh kolem ${clockTime(health.next)}`
                  : undefined
              flashToast(context, CLAUSES_CORRECTED_TOAST, 'neutral', undefined, detail)
            }
            flashIssueFixed(context, { focus: 'articles', issueId: issue.id })
            return back()
          }
          case 'agreed': {
            let toast = agreedMeanwhileToast(outcome.name, outcome.agreedAt, now())
            flashToast(context, toast.message, 'neutral', undefined, toast.detail)
            return back()
          }
          case 'final-version':
            flashToast(context, FINAL_VERSION_MEANWHILE_TOAST)
            return back()
          case 'cancelled':
            flashToast(context, FINAL_VERSION_CANCELLED_TOAST)
            return back()
          case 'closed':
            flashToast(context, authorsClosedToast(outcome.issueName))
            return back()
          default:
            return notFound()
        }
      },

      async renewLink(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null || issue.closedAt !== null)
          return notFound()
        await articlesOf(context).links.renew(issue.id, now())
        flashToast(context, RENEWED_TOAST)
        flashLinkChanged(context.get(Session), issue.name)
        return redirect(routes.issues.show.href({ name: issue.name }), 303)
      },

      /*
       * `12k`, `12l`: the handover at once, then back to the detail with a toast whose _Vrátit_
       * cancels this very handover. With `?undo=`, it is that _Vrátit_ after a cancellation: the
       * cancelled handover stands again whole, its own time and its place in the digest included.
       */
      async handOver(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        if (issue === null || article === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        if (issue.closedAt !== null) {
          flashToast(context, closedHandOverToast(issue.name))
          return back()
        }
        let undo = undoOf(context)
        let editor = context.auth.identity
        let outcome: HandoverOutcome
        try {
          outcome =
            undo === null
              ? await articlesOf(context).articles.handOver(
                  article.id,
                  { email: editor.email, name: editor.displayName || null },
                  now(),
                )
              : await articlesOf(context).articles.restoreHandover(article.id, undo)
        } catch {
          flashToast(context, HAND_OVER_FAILED_TOAST, 'error')
          return back()
        }
        switch (outcome.kind) {
          case 'done':
            /* _Vrátit_ answers with the row itself, as it does in `13b`, and leaves it where it
               stands: after an undo its own state already puts it there. */
            if (undo === null) {
              flashSettled(context, { at: null, id: article.id, state: 'writing' })
              flashToast(context, HANDED_OVER_TOAST, 'neutral', {
                action: `${routes.issues.cancelHandover.href({ id: String(article.id), name: issue.name })}?undo=${encodeURIComponent(stamp(outcome.at))}`,
                label: UNDO_LABEL,
              })
            }
            return back()
          case 'handed-over':
            flashRace(context, alreadyHandedOverToast(outcome.step, now()))
            return back()
          case 'proofreading':
            flashRace(context, alreadyProofreadingToast(outcome.step))
            return back()
          case 'not-handed-over':
            flashRace(context, ALREADY_CANCELLED_TOAST)
            return back()
          case 'gone':
            return notFound()
        }
      },

      /*
       * `12k`, `12l`: the cancellation at once, with _Vrátit_ that restores the handover. With
       * `?undo=`, it is the _Vrátit_ after a handover, and takes back only that one.
       */
      async cancelHandover(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let article = issue === null ? null : await articleOf(context, issue, context.params.id)
        if (issue === null || article === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        if (issue.closedAt !== null) {
          flashToast(context, closedCancelToast(issue.name))
          return back()
        }
        let undo = undoOf(context)
        let outcome: HandoverOutcome
        try {
          outcome = await articlesOf(context).articles.cancelHandover(
            article.id,
            now(),
            undo ?? undefined,
          )
        } catch {
          flashToast(context, CANCEL_FAILED_TOAST, 'error')
          return back()
        }
        switch (outcome.kind) {
          case 'done': {
            if (undo === null) {
              let at = article.handover === null ? null : stamp(article.handover.at)
              flashSettled(context, { at, id: article.id, state: 'handedOver' })
              flashToast(context, HANDOVER_CANCELLED_TOAST, 'neutral', {
                action: `${routes.issues.handOver.href({ id: String(article.id), name: issue.name })}?undo=${encodeURIComponent(stamp(outcome.at))}`,
                label: UNDO_LABEL,
              })
            }
            return back()
          }
          case 'handed-over':
            flashRace(context, alreadyHandedOverToast(outcome.step, now()))
            return back()
          case 'proofreading':
            flashRace(context, cancelTooLateToast(outcome.step))
            return back()
          case 'not-handed-over':
            flashRace(context, ALREADY_CANCELLED_TOAST)
            return back()
          case 'gone':
            return notFound()
        }
      },

      /* `12o`: the batch's request again, then back to the same filter with what happened. */
      async resendBatch(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let batch = issue === null ? null : await batchOf(context, issue, context.params.id)
        if (issue === null || batch === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let outcome = await resendBatch(articlesOf(context).artworks, batch.id)
        switch (outcome.kind) {
          case 'sent':
          case 'already-sent':
            flashToast(context, resentToast(batch.providerEmail))
            return back()
          case 'refused':
            flashToast(context, RESEND_REFUSED_TOAST, 'error')
            return back()
          case 'pdf-gone':
            flashToast(context, RESEND_PDF_GONE_TOAST, 'error')
            return back()
          case 'folder-gone':
            flashToast(context, RESEND_FOLDER_GONE_TOAST, 'error')
            return back()
          case 'daily-cap':
            flashToast(context, RESEND_DAILY_CAP_TOAST, 'error')
            return back()
          case 'disconnected':
          case 'not-connected':
            flashToast(context, RESEND_DISCONNECTED_TOAST, 'error')
            return back()
          case 'unavailable':
            flashToast(context, RESEND_UNAVAILABLE_TOAST, 'error')
            return back()
          case 'closed':
          case 'gone':
            return notFound()
        }
      },

      async askDiscardBatch(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let batch = issue === null ? null : await batchOf(context, issue, context.params.id)
        if (issue === null || batch === null || issue.closedAt !== null) return notFound()
        /* An approved batch, or one whose consent was recorded, goes back to the table. */
        if (!canDiscardBatch(batch)) return redirect(detailHref(issue, filterOf(context)), 303)
        return renderDetail(context, issue, { discarding: discardingView(context, issue, batch) })
      },

      async discardBatch(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let batch = issue === null ? null : await batchOf(context, issue, context.params.id)
        if (issue === null || batch === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let wasSent = formText(context, 'wasSent') === 'true'
        let outcome = await discardBatch(articlesOf(context).artworks, batch.id, wasSent)
        switch (outcome.kind) {
          case 'discarded':
            flashToast(context, discardedToast(outcome.batch.artworks.length))
            return back()
          /* The job or another editor got there first: nothing went to the bin (`12o`). */
          case 'approved':
            flashToast(context, DISCARD_APPROVED_TOAST)
            return back()
          case 'verified':
            flashToast(context, DISCARD_VERIFIED_TOAST)
            return back()
          /* A folder went missing while the dialog was open: it stays open and says which. */
          case 'folder-gone': {
            let holder = await holderOf(articlesOf(context).artworks, batch)
            let urls = holder === null ? {} : subfolderUrls(holder)
            return renderDetail(context, issue, {
              discarding: {
                ...discardingView(context, issue, batch),
                folderGone: {
                  heading: missingFoldersHeading(outcome.missing, batch.holder.kind),
                  urls,
                },
              },
              status: IN_THE_WAY,
            })
          }
          /* An action with a dialog keeps its error in the dialog (`12o`, `11c`). */
          case 'unavailable':
            return renderDetail(context, issue, {
              discarding: {
                ...discardingView(context, issue, batch),
                refusal: outcome.isPartlyBinned ? 'partly-binned' : 'unavailable',
              },
              status: IN_THE_WAY,
            })
          case 'not-connected':
          case 'disconnected':
            return renderDetail(context, issue, {
              discarding: { ...discardingView(context, issue, batch), refusal: 'disconnected' },
              status: IN_THE_WAY,
            })
          /* The provider's page sent the request while a dialog that did not say so was open:
             nothing to discard, the table now says _U poskytovatele_. Discarded in another tab,
             turned into an error of its archive, or the issue closed meanwhile: the table, or the
             closed issue's Callout, says what holds now (#154). */
          case 'already-sent':
          case 'not-discardable':
          case 'closed':
            return back()
          case 'gone':
            return notFound()
        }
      },

      /*
       * _Dokončit vydání_ acts without a question (`12i`), so every answer but one is a toast on
       * the page it was clicked on: the row of the overview, or the detail. A gone issue folder
       * is the exception, a Callout in the detail that says how to bring it back, because it
       * holds until somebody does; it goes there by a redirect too, so the address stays one a
       * reload can open.
       */
      async finish(context) {
        let { setup, store } = issuesOf(context)
        let issue = await store.findByName(context.params.name)
        if (issue === null) return notFound()

        let isFromOverview = formText(context, 'returnTo') === 'overview'
        let filter = parseIssueFilter(formText(context, 'state'))
        let back = () =>
          redirect(
            isFromOverview
              ? `${routes.home.href()}${issueFilterSearch(filter)}`
              : routes.issues.show.href({ name: issue.name }),
            303,
          )
        let { expectedEmail } = context.get(DriveAccount)

        let outcome = await finishIssue(setup, issue)
        switch (outcome.kind) {
          case 'finished':
            flashToast(context, finishedToast(issue.name))
            flashLinkChanged(context.get(Session), issue.name)
            return back()
          case 'folder-gone':
            flashFolderGone(context.get(Session), issue.name)
            return redirect(routes.issues.show.href({ name: issue.name }), 303)
          case 'not-found':
            return notFound()
          case 'unavailable':
            flashToast(context, FINISH_UNAVAILABLE_TOAST, 'error')
            return back()
          case 'not-connected':
            flashToast(context, notConnectedToast(expectedEmail), 'error')
            return back()
          case 'disconnected':
            flashToast(context, disconnectedBanner(expectedEmail), 'error')
            return back()
        }
      },
    },
  })
}
