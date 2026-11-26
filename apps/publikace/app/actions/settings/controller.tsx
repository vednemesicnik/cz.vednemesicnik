import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { AccessContext } from '../../auth/access.server.ts'
import type { SignedInUntilCookie } from '../../auth/session.server.ts'
import type { JobRunStore } from '../../data/job-runs.server.ts'
import type { ProofreadersStore } from '../../data/proofreaders.server.ts'
import {
  type AccessKind,
  addedMessage,
  checkAddress,
  checkProofreadersAddress,
  duplicateMessage,
  MEMBERSHIP_UNAVAILABLE_MESSAGE,
  PROOFREADERS_SAVED,
  unknownGroupMessage,
} from '../../domain/access.ts'
import { type DriveFileIds, driveFileRows, driveFilesIntro } from '../../domain/drive-files.ts'
import { JOBS, settingsSummary, stateOfJob } from '../../domain/jobs.ts'
import { now } from '../../domain/time.ts'
import { Access } from '../../middleware/access.server.ts'
import { type Person, requireEditor } from '../../middleware/auth.server.ts'
import {
  DriveAccount,
  type DriveAccountContext,
  takeConnectRefusal,
} from '../../middleware/drive-account.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import type { AppContext } from '../../router.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import {
  type AddForm,
  type ProofreadersForm,
  type RemovalQuestion,
  SettingsPage,
} from './settings-page.tsx'

/**
 * What the helpers below read. Every action's context has it; it is written loosely because the
 * actions' contexts differ in their params, and the three values are read back by their keys.
 */
type PageContext = {
  get(key: unknown): unknown
  method: string
  render: AppContext['render']
}

function accessOf(context: PageContext): AccessContext {
  return context.get(Access) as AccessContext
}

type PageState = {
  addForm?: AddForm
  isRoleLost?: boolean
  proofreadersForm?: ProofreadersForm
  question?: RemovalQuestion
}

type Stores = {
  /** The IDs of the deployment's files on Drive, for Soubory na Disku (`14a`). */
  driveFiles: DriveFileIds
  proofreaders: ProofreadersStore
  runs: JobRunStore
}

async function renderSettings(
  context: PageContext,
  { driveFiles, proofreaders, runs }: Stores,
  editor: Person,
  state: PageState,
  init?: ResponseInit,
): Promise<Response> {
  let access = accessOf(context)
  let driveAccount = context.get(DriveAccount) as DriveAccountContext
  let [accounts, groups, driveState, jobs, proofreadersAddress] = await Promise.all([
    access.directory.listAccounts(),
    access.directory.listGroups(),
    driveAccount.store.state(),
    Promise.all(JOBS.map(async (job) => ({ job, latest: await runs.latest(job.key) }))),
    proofreaders.find(),
  ])
  let today = now()
  let hasRegistry = driveFiles.registrySpreadsheetId !== ''
  /* Asked on every visit, as when a group is added to Přístup (`03`, row 27): the warning stands
     while the service does not know the address and goes by itself once it does. A service that
     does not answer shows nothing, since it says nothing about the address. Not for a form drawn
     again, which should not wait on the service for a warning beside the point. */
  let isProofreadersUnknownGroup =
    context.method === 'GET' &&
    proofreadersAddress !== null &&
    (await access.checkMembership(editor.email, proofreadersAddress.email)).status ===
      'unknown-group'

  return context.render(
    <SettingsPage
      accounts={accounts}
      addForm={state.addForm}
      domain={access.domain}
      driveFiles={{
        intro: driveFilesIntro(hasRegistry),
        rows: driveFileRows(driveFiles),
      }}
      driveAccount={{
        expectedEmail: driveAccount.expectedEmail,
        hasRegistry,
        refusal: takeConnectRefusal(context.get(Session) as Session | undefined),
        state: driveState,
      }}
      editor={editor}
      groups={groups}
      isProofreadersUnknownGroup={isProofreadersUnknownGroup}
      isRoleLost={state.isRoleLost}
      jobsSummary={jobs.map(({ job, latest }) =>
        settingsSummary(job, stateOfJob(job, latest, today), today),
      )}
      proofreaders={proofreadersAddress?.email ?? null}
      proofreadersForm={state.proofreadersForm}
      question={state.question}
      toasts={context.get(Toasts) as readonly ToastMessage[]}
      today={today}
    />,
    init,
  )
}

/**
 * A change sent by somebody who is not an administrator — by the time it arrived. `14b`: the
 * page comes back read-only with the Callout that says why, and nothing changed.
 */
function roleLost(context: PageContext, stores: Stores, editor: Person): Promise<Response> {
  return renderSettings(
    context,
    stores,
    { ...editor, isAdmin: false },
    { isRoleLost: true },
    { status: 403 },
  )
}

function backToSettings(): Response {
  return redirect(routes.settings.index.href(), 303)
}

function idParam(value: string | undefined): number | null {
  let id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function formText(context: PageContext, name: string): string {
  let value = (context.get(FormData) as FormData).get(name)
  return typeof value === 'string' ? value : ''
}

export type SettingsDependencies = Stores

export default function createSettingsController(
  signedInUntil: SignedInUntilCookie,
  dependencies: SettingsDependencies,
) {
  let stores = dependencies
  return createController(routes.settings, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      index(context) {
        return renderSettings(context, stores, context.auth.identity, {})
      },

      async addAccess(context) {
        let editor = context.auth.identity
        if (!editor.isAdmin) return roleLost(context, stores, editor)

        let { checkMembership, directory, domain } = context.get(Access)
        let kind: AccessKind = formText(context, 'kind') === 'group' ? 'group' : 'account'
        let value = formText(context, 'email')

        let refuse = (error: string) =>
          renderSettings(
            context,
            stores,
            editor,
            { addForm: { error, kind, value } },
            { status: 400 },
          )

        let address = checkAddress(kind, value, domain)
        if (!address.ok) return refuse(address.message)

        let groupName: string | null = null
        if (kind === 'group') {
          /* The service is asked before the group is stored, so a group missing from its
             `allowedGroups` shows here and not at somebody's sign-in (`03`, row 27). Whether the
             one asking is a member does not matter; only that the service knows the group, and
             its answer names the group either way. */
          let answer = await checkMembership(editor.email, address.email)
          if (answer.status === 'unknown-group') return refuse(unknownGroupMessage(address.email))
          if (answer.status === 'unavailable') return refuse(MEMBERSHIP_UNAVAILABLE_MESSAGE)
          groupName = answer.groupName
        }

        let result =
          kind === 'account'
            ? await directory.addAccount(editor.email, address.email, now())
            : await directory.addGroup(editor.email, address.email, groupName, now())

        if (!result.ok) {
          if (result.reason === 'not-admin') return roleLost(context, stores, editor)
          return refuse(duplicateMessage(kind, address.email))
        }

        flashToast(context, addedMessage(kind, address.email, groupName))
        return backToSettings()
      },

      async setAdmin(context) {
        let editor = context.auth.identity
        let id = idParam(context.params.id)
        if (id === null) return backToSettings()

        let result = await context
          .get(Access)
          .directory.setAdmin(editor.email, id, formText(context, 'isAdmin') === '1')

        if (!result.ok && result.reason === 'not-admin') return roleLost(context, stores, editor)
        // The badge and the menu show the outcome; a refused self or last administrator is the
        // data layer's safeguard and has no message of its own (`14a`).
        return backToSettings()
      },

      async askRemoveAccount(context) {
        let editor = context.auth.identity
        let id = idParam(context.params.id)
        if (!editor.isAdmin || id === null) return backToSettings()

        let accounts = await context.get(Access).directory.listAccounts()
        let account = accounts.find((candidate) => candidate.id === id)
        let administratorCount = accounts.filter((candidate) => candidate.isAdmin).length

        if (
          account === undefined ||
          account.email === editor.email ||
          (account.isAdmin && administratorCount <= 1)
        ) {
          return backToSettings()
        }

        return renderSettings(context, stores, editor, { question: { account, kind: 'account' } })
      },

      async removeAccount(context) {
        let editor = context.auth.identity
        let id = idParam(context.params.id)
        if (id === null) return backToSettings()

        let result = await context.get(Access).directory.removeAccount(editor.email, id)
        if (!result.ok && result.reason === 'not-admin') return roleLost(context, stores, editor)
        return backToSettings()
      },

      async askRemoveGroup(context) {
        let editor = context.auth.identity
        let id = idParam(context.params.id)
        if (!editor.isAdmin || id === null) return backToSettings()

        let groups = await context.get(Access).directory.listGroups()
        let group = groups.find((candidate) => candidate.id === id)
        if (group === undefined) return backToSettings()

        return renderSettings(context, stores, editor, { question: { group, kind: 'group' } })
      },

      /* `14f`: the dialog over Nastavení. Only an administrator changes the address, since it
         decides who works as a proofreader (`sh0zp1if`); anybody else goes back to the page. */
      async askProofreaders(context) {
        let editor = context.auth.identity
        if (!editor.isAdmin) return backToSettings()
        let current = await dependencies.proofreaders.find()
        return renderSettings(context, stores, editor, {
          proofreadersForm: { error: null, value: current?.email ?? '' },
        })
      },

      async saveProofreaders(context) {
        let editor = context.auth.identity
        if (!editor.isAdmin) return roleLost(context, stores, editor)
        let value = formText(context, 'email')
        let address = checkProofreadersAddress(value, context.get(Access).domain)
        if (!address.ok) {
          return renderSettings(
            context,
            stores,
            editor,
            { proofreadersForm: { error: address.message, value } },
            { status: 400 },
          )
        }
        await dependencies.proofreaders.save(address.email, editor.email, now())
        flashToast(context, PROOFREADERS_SAVED)
        return backToSettings()
      },

      async removeGroup(context) {
        let editor = context.auth.identity
        let id = idParam(context.params.id)
        if (id === null) return backToSettings()

        let result = await context.get(Access).directory.removeGroup(editor.email, id)
        if (!result.ok && result.reason === 'not-admin') return roleLost(context, stores, editor)
        return backToSettings()
      },
    },
  })
}
