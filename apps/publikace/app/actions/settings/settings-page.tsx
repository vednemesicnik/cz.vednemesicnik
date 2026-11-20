import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import type { AccessAccount, AccessGroup } from '../../data/access.server.ts'
import type { DriveAccountState } from '../../data/drive-account.server.ts'
import { type AccessKind, administratorsSentence, roleLostMessage } from '../../domain/access.ts'
import {
  accountDomain,
  CONNECTED_CARD_TEXT,
  type ConnectionRefusal,
  connectHint,
  DISCONNECTED_CARD_TEXT,
  MAILBOX_CARD_TEXT,
  NOT_CONNECTED_CARD_TEXT,
  refusalMessage,
  shortAccount,
} from '../../domain/drive-account.ts'
import { JOBS_TITLE, SHOW_JOBS_LABEL } from '../../domain/jobs.ts'
import { formatDate, formatDay } from '../../domain/time.ts'
import type { Editor } from '../../middleware/auth.server.ts'
import { routes } from '../../routes.ts'
import { Avatar } from '../../ui/avatar/component.tsx'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { Dialog } from '../../ui/dialog/component.tsx'
import { DialogTitle } from '../../ui/dialog-title/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { StatusTag } from '../../ui/status-tag/component.tsx'
import { Document } from '../document.tsx'

/** What the add form was sent with, drawn again when it was refused. */
export type AddForm = {
  error: string
  kind: AccessKind
  value: string
}

/** The removal asked at its own address, drawn over the page. */
export type RemovalQuestion =
  | { account: AccessAccount; kind: 'account' }
  | { group: AccessGroup; kind: 'group' }

/** The account the app acts as on Drive, and why the last return from Google was refused. */
export type DriveAccountView = {
  expectedEmail: string
  refusal: ConnectionRefusal | null
  state: DriveAccountState
}

export type SettingsPageProps = {
  accounts: readonly AccessAccount[]
  addForm?: AddForm
  /** Without the `@`. */
  domain: string
  driveAccount: DriveAccountView
  editor: Editor
  groups: readonly AccessGroup[]
  /** `14b`: a change was sent from a page opened before the role was taken away. */
  isRoleLost?: boolean
  /** The line under _Úlohy na pozadí_, one per job that reports (`14a`). */
  jobsSummary: readonly string[]
  question?: RemovalQuestion
  toasts?: readonly ToastMessage[]
  today: Temporal.Instant
}

/* The page column and the parts of Nastavení, as `14-Nastaveni.dc.html` sets them. */
const columnStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  margin: '0 auto',
  maxWidth: '640px',
  width: '100%',
})

const partStyle = css({
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingTop: '24px',
  '& h2': { fontSize: '16px', fontWeight: 600, margin: 0 },
  '& h3': { fontSize: '14px', fontWeight: 600, margin: '8px 0 0' },
})

/* `14a`'s `.bar`: the part's title, and its link at the far end. */
const partBarStyle = css({
  alignItems: 'baseline',
  display: 'flex',
  gap: '12px',
  justifyContent: 'space-between',
})

/* The design system draws a link in its own colour, and has no rule for a bare one. */
const partLinkStyle = css({
  color: 'var(--link)',
  fontSize: '14px',
  '&:hover': { color: 'var(--link-hover)' },
})

const metaStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  lineHeight: 1.5,
  margin: 0,
})

const rowStyle = css({
  alignItems: 'center',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  gap: '12px',
  justifyContent: 'space-between',
  padding: '10px 0',
})

const whoStyle = css({
  alignItems: 'center',
  display: 'flex',
  gap: '10px',
  minWidth: 0,
})

const whoTextStyle = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  overflowWrap: 'anywhere',
  textWrap: 'pretty',
})

const nameStyle = css({ fontSize: '14px', fontWeight: 500 })

/* The cards of Účty Publikace: `.acct` and `.hintline` in `14-Nastaveni-ucet.dc.html`. */
const cardsStyle = css({
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
})

const cardStyle = css({
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  minWidth: 0,
  padding: '16px',
})

const cardHeadStyle = css({
  alignItems: 'flex-start',
  display: 'flex',
  gap: '12px',
  justifyContent: 'space-between',
})

const cardNameStyle = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  '& strong': { fontSize: '15px', fontWeight: 600 },
})

const hintStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  lineHeight: 1.5,
  margin: 0,
  overflowWrap: 'anywhere',
})

const endStyle = css({ alignItems: 'center', display: 'flex', flex: 'none', gap: '6px' })

const groupIconStyle = css({
  alignItems: 'center',
  background: 'var(--bg-tertiary)',
  borderRadius: '999px',
  color: 'var(--text-secondary)',
  display: 'inline-flex',
  flex: 'none',
  height: '32px',
  justifyContent: 'center',
  width: '32px',
})

/*
 * The "⋯" menu opens with no script: a `<details>` keeps the design system's trigger and panel
 * and holds the panel under the trigger, where a popover would need anchor positioning the
 * browser floor (Safari 17.5) does not have.
 */
const menuStyle = css({
  '& > summary': { listStyle: 'none' },
  '& > summary::-webkit-details-marker': { display: 'none' },
  '& form': { display: 'contents' },
})

/*
 * One field for both kinds: the label and the hint follow the switch above it, by the switch's
 * own state, so it works before and without a script.
 */
const addFormStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  paddingTop: '4px',
  '&:has(input[name="kind"][value="group"]:checked) [data-kind="account"]': { display: 'none' },
  '&:has(input[name="kind"][value="account"]:checked) [data-kind="group"]': { display: 'none' },
})

const addRowStyle = css({
  alignItems: 'flex-end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
})

const fieldStyle = css({ flex: '1 1 280px', maxWidth: '380px' })

/* Level with the input while the hint hangs below it. */
const addButtonStyle = css({ paddingBottom: '26px' })

const readOnlyListStyle = css({
  display: 'flex',
  flexDirection: 'column',
  fontSize: '14px',
  gap: '6px',
  overflowWrap: 'anywhere',
})

/*
 * The add form and the way to a removal question load a whole page (`data-rmx-document`). Within
 * the page, the client runtime keeps what was typed into the field after an address was added,
 * where `14b` empties it, and `autofocus` — the refused field, _Zrušit_ in the question — only
 * takes effect when a document loads.
 */

/** Breaks a long address before the `@` first, as `14a` asks. */
function Address(handle: Handle<{ email: string }>) {
  return () => {
    let [local, domain] = handle.props.email.split('@')
    return domain === undefined ? (
      <>{local}</>
    ) : (
      <>
        {local}
        <wbr />@{domain}
      </>
    )
  }
}

function GroupIcon(_handle: Handle) {
  return () => (
    <span mix={groupIconStyle}>
      <svg
        aria-hidden="true"
        fill="none"
        height="16"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        width="16"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </span>
  )
}

function accountName(account: AccessAccount): string {
  return account.displayName ?? account.email
}

type AccountRowProps = {
  account: AccessAccount
  administratorCount: number
  isSelf: boolean
  today: Temporal.Instant
}

/** `14a`, _Jednotlivé účty_: one named account. */
function AccountRow(handle: Handle<AccountRowProps>) {
  return () => {
    let { account, administratorCount, isSelf, today } = handle.props
    let name = accountName(account)

    let meta: string | null
    if (account.displayName === null) {
      meta = `účet přidán ${formatDate(account.addedAt)} · zatím bez přihlášení`
    } else if (!isSelf && account.lastSignedInAt !== null) {
      meta = `${account.email} · poslední přihlášení ${formatDay(account.lastSignedInAt, today)}`
    } else {
      meta = account.email
    }

    // Nobody changes their own row, and the last administrator keeps the role (`14a`).
    let hasMenu = !isSelf && !(account.isAdmin && administratorCount <= 1)

    return (
      <div mix={rowStyle}>
        <span mix={whoStyle}>
          <Avatar name={name} size={32} />
          <span mix={whoTextStyle}>
            <span mix={nameStyle}>
              {account.displayName === null ? <Address email={account.email} /> : name}
              {isSelf ? (
                <>
                  {' '}
                  <span mix={metaStyle}>(vy)</span>
                </>
              ) : null}
            </span>
            <span mix={metaStyle}>{meta}</span>
          </span>
        </span>
        <span mix={endStyle}>
          {account.isAdmin ? <span class="vdm-badge vdm-badge--violet">Správce</span> : null}
          {hasMenu ? (
            <details class="vdm-actionmenu" mix={menuStyle}>
              <summary
                aria-label={`Další akce ${name}`}
                class="vdm-btn vdm-btn--outline vdm-btn--sm vdm-actionmenu__trigger"
              >
                ⋯
              </summary>
              <div class="vdm-menu vdm-menu--end">
                <form
                  action={routes.settings.setAdmin.href({ id: String(account.id) })}
                  method="post"
                >
                  <CsrfField />
                  <input name="isAdmin" type="hidden" value={account.isAdmin ? '0' : '1'} />
                  <button class="vdm-menu__item" type="submit">
                    {account.isAdmin ? 'Odebrat roli správce' : 'Nastavit jako správce'}
                  </button>
                </form>
                <span class="vdm-menu__sep" role="separator"></span>
                <a
                  class="vdm-menu__item vdm-menu__item--danger"
                  data-rmx-document
                  href={routes.settings.askRemoveAccount.href({ id: String(account.id) })}
                >
                  Odebrat…
                </a>
              </div>
            </details>
          ) : null}
        </span>
      </div>
    )
  }
}

/** `14a`, _Skupiny Google_: one group, by its address. */
function GroupRow(handle: Handle<{ group: AccessGroup }>) {
  return () => {
    let { group } = handle.props

    return (
      <div mix={rowStyle}>
        <span mix={whoStyle}>
          <GroupIcon />
          <span mix={whoTextStyle}>
            <span mix={nameStyle}>
              <Address email={group.email} />
            </span>
            <span mix={metaStyle}>členství se ověřuje při přihlášení a pak každých 10 minut</span>
          </span>
        </span>
        <a
          class="vdm-btn vdm-btn--ghost vdm-btn--sm"
          data-rmx-document
          href={routes.settings.askRemoveGroup.href({ id: String(group.id) })}
        >
          Odebrat
        </a>
      </div>
    )
  }
}

type AddAccessFormProps = {
  addForm: AddForm | undefined
  domain: string
}

/** `14a`: the switch, the address and _Přidat_. No dialog: adding takes nothing away. */
function AddAccessForm(handle: Handle<AddAccessFormProps>) {
  return () => {
    let { addForm, domain } = handle.props
    let kind = addForm?.kind ?? 'account'
    let error = addForm?.error

    return (
      <form
        action={routes.settings.addAccess.href()}
        data-rmx-document
        method="post"
        mix={addFormStyle}
        noValidate
      >
        <CsrfField />
        <div
          aria-label="Co přidat"
          class="vdm-seg"
          role="radiogroup"
          style={{ alignSelf: 'flex-start' }}
        >
          <label class="vdm-seg__opt">
            <input checked={kind === 'account'} name="kind" type="radio" value="account" /> Účet
          </label>
          <label class="vdm-seg__opt">
            <input checked={kind === 'group'} name="kind" type="radio" value="group" /> Skupinu
          </label>
        </div>
        <div mix={addRowStyle}>
          <div class="vdm-field" mix={fieldStyle}>
            <label class="vdm-field__label" for="access-email">
              <span data-kind="account">Adresa účtu</span>
              <span data-kind="group">Adresa skupiny</span>
            </label>
            <input
              aria-describedby={
                error === undefined
                  ? 'access-email-hint-account access-email-hint-group'
                  : 'access-email-error'
              }
              aria-invalid={error === undefined ? undefined : 'true'}
              autocapitalize="none"
              autocomplete="off"
              autocorrect="off"
              // A refused address gets the focus back, so it is the next thing typed into.
              autofocus={error === undefined ? undefined : true}
              class={
                error === undefined
                  ? 'vdm-field__input'
                  : 'vdm-field__input vdm-field__input--error'
              }
              id="access-email"
              name="email"
              placeholder={`jmeno@${domain}`}
              spellcheck={false}
              type="email"
              value={addForm?.value ?? ''}
            />
            {error === undefined ? (
              <>
                <span class="vdm-field__hint" data-kind="account" id="access-email-hint-account">
                  Jen adresa @{domain}. Pozvánka se neposílá.
                </span>
                <span class="vdm-field__hint" data-kind="group" id="access-email-hint-group">
                  Skupina Google na doméně {domain}.
                </span>
              </>
            ) : (
              <span class="vdm-field__hint vdm-field__hint--error" id="access-email-error">
                {error}
              </span>
            )}
          </div>
          <div mix={addButtonStyle}>
            <button class="vdm-btn vdm-btn--outline" type="submit">
              Přidat
            </button>
          </div>
        </div>
      </form>
    )
  }
}

type ReadOnlyAccessProps = {
  accounts: readonly AccessAccount[]
  groups: readonly AccessGroup[]
  isRoleLost: boolean
}

/** `14b`, right: Přístup as somebody who is not an administrator sees it. */
function ReadOnlyAccess(handle: Handle<ReadOnlyAccessProps>) {
  return () => {
    let { accounts, groups, isRoleLost } = handle.props
    let administrators = accounts.filter((account) => account.isAdmin).map(accountName)

    return (
      <>
        {isRoleLost ? (
          <Callout tone="info">{roleLostMessage(administrators.length)}</Callout>
        ) : null}
        <p mix={metaStyle}>{administratorsSentence(administrators)}</p>
        <div mix={readOnlyListStyle}>
          {groups.length === 0 ? null : (
            <span>
              <strong style={{ fontWeight: 600 }}>Skupiny</strong> ·{' '}
              {groups.map((group) => group.email).join(', ')}
            </span>
          )}
          <span>
            <strong style={{ fontWeight: 600 }}>Účty</strong> · {accounts.length}
          </span>
        </div>
      </>
    )
  }
}

/** `14b`, the two removal dialogs, at their own address over the page. */
function RemovalDialog(handle: Handle<{ question: RemovalQuestion }>) {
  return () => {
    let { question } = handle.props
    let action =
      question.kind === 'account'
        ? routes.settings.removeAccount.href({ id: String(question.account.id) })
        : routes.settings.removeGroup.href({ id: String(question.group.id) })

    return (
      <Dialog maxWidth="360px">
        <DialogTitle>
          {question.kind === 'account' ? 'Odebrat účet?' : 'Odebrat skupinu?'}
        </DialogTitle>
        <div class="vdm-dialog__body">
          {question.kind === 'account' ? (
            <>
              <p class="vdm-dialog__text" style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {accountName(question.account)}
                </strong>
                {question.account.displayName === null ? null : (
                  <span>{question.account.email}</span>
                )}
              </p>
              <p class="vdm-dialog__text">
                Účet bude odhlášen ze všech zařízení. Znovu se s ním lze přihlásit jen přes skupinu
                s přístupem. Vydání založená tímto účtem zůstanou.
              </p>
            </>
          ) : (
            <>
              <p class="vdm-dialog__text" style={{ overflowWrap: 'anywhere' }}>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {question.group.email}
                </strong>
              </p>
              <p class="vdm-dialog__text">
                Členové skupiny přijdou o přístup nejpozději za 10 minut, pokud tu nejsou jmenovitě
                nebo v jiné skupině s přístupem. Skupina v Google Workspace zůstane.
              </p>
            </>
          )}
        </div>
        <form action={action} class="vdm-dialog__actions" method="post">
          <CsrfField />
          {/* Focus starts on the way back, so Enter on arrival never removes anybody. */}
          <a
            autofocus
            class="vdm-btn vdm-btn--ghost vdm-btn--sm"
            href={routes.settings.index.href()}
          >
            Zrušit
          </a>
          <button class="vdm-btn vdm-btn--danger vdm-btn--sm" type="submit">
            Odebrat
          </button>
        </form>
      </Dialog>
    )
  }
}

function CardName(handle: Handle<{ email: string }>) {
  return () => (
    <span mix={cardNameStyle}>
      <strong>{shortAccount(handle.props.email)}</strong>
      <span mix={metaStyle}>{accountDomain(handle.props.email)}</span>
    </span>
  )
}

const TAGS = {
  connected: { label: 'Připojeno', tone: 'done' },
  disconnected: { label: 'Odpojeno', tone: 'problem' },
  'not-connected': { label: 'Nepřipojeno', tone: 'waiting' },
} as const

/**
 * The card of `publikace.app@` in its three states: _Nepřipojeno_ (`14g`), _Připojeno_ (`14a`)
 * and _Odpojeno_ (`14c`). A refused return from Google stands above the button (`14h`); while
 * the account is connected — somebody connected it meanwhile — under the head, as the card has
 * no button then.
 */
function DriveAccountCard(handle: Handle<{ view: DriveAccountView }>) {
  return () => {
    let { expectedEmail, refusal, state } = handle.props.view
    let tag = TAGS[state.status]
    let isConnected = state.status === 'connected'
    let message = refusal === null ? null : refusalMessage(refusal, expectedEmail, isConnected)

    return (
      <div mix={cardStyle}>
        <div mix={cardHeadStyle}>
          <CardName email={expectedEmail} />
          <StatusTag tone={tag.tone}>{tag.label}</StatusTag>
        </div>
        {isConnected ? (
          <>
            {message === null ? null : (
              <Callout tone="info">
                <p style={{ margin: 0 }}>{message}</p>
              </Callout>
            )}
            <p mix={metaStyle}>{CONNECTED_CARD_TEXT}</p>
          </>
        ) : (
          <>
            <p mix={metaStyle}>
              {state.status === 'not-connected' ? NOT_CONNECTED_CARD_TEXT : DISCONNECTED_CARD_TEXT}
            </p>
            {message === null ? null : (
              <Callout tone="error">
                <p style={{ margin: 0 }}>{message}</p>
              </Callout>
            )}
            {/* A whole-page navigation, like the sign-in: the answer sends the browser to
                accounts.google.com, which the client runtime's fetch could not follow. */}
            <form action={routes.settings.account.connect.href()} data-rmx-document method="post">
              <CsrfField />
              <button class="vdm-btn vdm-btn--primary vdm-btn--sm" type="submit">
                {state.status === 'not-connected' ? 'Připojit účet' : 'Připojit znovu'}
              </button>
            </form>
            <p mix={hintStyle}>{connectHint(expectedEmail)}</p>
          </>
        )}
      </div>
    )
  }
}

/** The mailbox `publikace@`: the app never connects it, so it has no state (`14a`). */
function MailboxCard(handle: Handle<{ email: string }>) {
  return () => (
    <div mix={cardStyle}>
      <div mix={cardHeadStyle}>
        <CardName email={handle.props.email} />
      </div>
      <p mix={metaStyle}>{MAILBOX_CARD_TEXT}</p>
    </div>
  )
}

/**
 * `/settings`: Nastavení with Přístup (`14a`, `14b`), Účty Publikace (`14a`, `14g`, `14h`,
 * `14c`) and the way to Úlohy na pozadí (`14a`, `14d`).
 *
 * The lead sentence under the title waits for the parts it names — files and proofreading arrive
 * with their own issues.
 */
export function SettingsPage(handle: Handle<SettingsPageProps>) {
  return () => {
    let {
      accounts,
      addForm,
      domain,
      driveAccount,
      editor,
      groups,
      isRoleLost = false,
      jobsSummary,
      question,
      toasts,
      today,
    } = handle.props
    let administratorCount = accounts.filter((account) => account.isAdmin).length

    return (
      <Document title="Nastavení">
        <Layout
          active="settings"
          driveAccount={{
            expectedEmail: driveAccount.expectedEmail,
            status: driveAccount.state.status,
          }}
          isInert={question !== undefined}
          person={editor}
          title="Nastavení"
          toasts={toasts}
        >
          <div mix={columnStyle}>
            <h1 class="vdm-page-title" style={{ margin: 0 }}>
              Nastavení
            </h1>

            <section aria-labelledby="access-title" mix={partStyle}>
              <h2 id="access-title">Přístup</h2>
              {editor.isAdmin ? (
                <>
                  <p mix={metaStyle}>
                    Přihlásit se mohou účty @{domain} přidané jmenovitě nebo přes skupinu. Přístup
                    mění jen správci, ostatní části aplikace mohou používat všichni přihlášení.
                    Redakce dostává odkazy.
                  </p>
                  {groups.length === 0 ? null : (
                    <>
                      <h3>Skupiny Google</h3>
                      <div>
                        {groups.map((group) => (
                          <GroupRow group={group} />
                        ))}
                      </div>
                    </>
                  )}
                  <h3>Jednotlivé účty</h3>
                  <div>
                    {accounts.map((account) => (
                      <AccountRow
                        account={account}
                        administratorCount={administratorCount}
                        isSelf={account.email === editor.email}
                        today={today}
                      />
                    ))}
                  </div>
                  <AddAccessForm addForm={addForm} domain={domain} />
                </>
              ) : (
                <ReadOnlyAccess accounts={accounts} groups={groups} isRoleLost={isRoleLost} />
              )}
            </section>

            <section aria-labelledby="accounts-title" id="accounts" mix={partStyle}>
              <h2 id="accounts-title">Účty Publikace</h2>
              <div mix={cardsStyle}>
                <DriveAccountCard view={driveAccount} />
                <MailboxCard email={`publikace@${accountDomain(driveAccount.expectedEmail)}`} />
              </div>
            </section>

            <section aria-labelledby="jobs-title" mix={partStyle}>
              <div mix={partBarStyle}>
                <h2 id="jobs-title">{JOBS_TITLE}</h2>
                <a href={routes.settings.jobs.index.href()} mix={partLinkStyle}>
                  {SHOW_JOBS_LABEL}
                </a>
              </div>
              {jobsSummary.map((line) => (
                <p mix={metaStyle}>{line}</p>
              ))}
            </section>
          </div>
        </Layout>
        {question === undefined ? null : <RemovalDialog question={question} />}
      </Document>
    )
  }
}
