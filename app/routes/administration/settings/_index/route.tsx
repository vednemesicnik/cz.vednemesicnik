// noinspection JSUnusedGlobalSymbols

import type { AuthorRoleName, ColorScheme } from '@generated/prisma/enums'
import { clsx } from 'clsx'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { href, useFetcher, useLocation, useNavigate } from 'react-router'

import { AdminAvatar } from '~/components/admin/admin-avatar'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminDetailRow } from '~/components/admin/admin-detail-row'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AdminSignInAttempts } from '~/components/admin/admin-sign-in-attempts'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { SegmentedControl } from '~/components/segmented-control'
import { useToast } from '~/components/toast-provider'
import { COLOR_SCHEME_CONFIG } from '~/config/color-scheme-config'
import { FORM_CONFIG } from '~/config/form-config'
import { useColorScheme } from '~/hooks/use-color-scheme'
import type { IdentityCheckFailure } from '~/utils/identity-check/parse-identity-check-failure'
import { getAuthorRoleLabel, getUserRoleLabel } from '~/utils/role-labels'
import { runWithViewTransition } from '~/utils/run-with-view-transition'
import { waitForColorScheme } from '~/utils/wait-for-color-scheme'

import type { action } from './_action'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { AddPasskeyDialog } from './components/add-passkey-dialog'
import { ChangePasswordDialog } from './components/change-password-dialog'
import { ConfirmDialog } from './components/confirm-dialog'
import { IdentityCheckDialog } from './components/identity-check-dialog'
import { PasskeyProblem } from './components/passkey-problem'
import { ProfileDialog } from './components/profile-dialog'
import { RegisterPasskey } from './components/register-passkey'
import type { RegistrationProblem } from './components/register-passkey/get-registration-problem'
import { useRegisterPasskey } from './components/register-passkey/use-register-passkey'
import { TextButton } from './components/text-button'
import { TwoFactorDialog } from './components/two-factor-dialog'
import { WelcomeRow } from './components/welcome-row'
import { buildSettingsContinuePath } from './utils/build-settings-continue-path'
import { formatOtherSignIns } from './utils/format-other-sign-ins'
import { formatRemainingBackupCodes } from './utils/format-remaining-backup-codes'
import { getPasskeyDetails } from './utils/get-passkey-details'
import { getPasskeyLabel } from './utils/get-passkey-label'
import type { SettingsContinue } from './utils/parse-settings-continue'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

// What each author role may do today, after the role name (design 29a,
// kacrd6y7: no „posílá ke schválení“ until that step exists).
const authorRoleDescriptions: Record<AuthorRoleName, string> = {
  contributor: 'spravuje vlastní koncepty',
  coordinator: 'spravuje veškerý obsah a schvaluje',
  creator: 'spravuje vlastní obsah, vidí i cizí koncepty',
}

// The colour scheme choices (design 29a, wording from copy thread 64fd5tyk).
const colorSchemeOptions = [
  { label: 'Systém', value: 'system' },
  { label: 'Světlý', value: 'light' },
  { label: 'Tmavý', value: 'dark' },
] satisfies { label: string; value: ColorScheme }[]

type OpenDialog =
  | { name: 'profile' }
  | { name: 'change-password' }
  | { name: 'enable-two-factor' }
  | { name: 'new-backup-codes' }
  | { name: 'disable-two-factor' }
  | { name: 'remove-passkey'; passkeyId: string }
  | { name: 'add-passkey' }
  | {
      name: 'identity-check'
      // The dialog to reopen after the round trip to Google (30a).
      settingsContinue: SettingsContinue | null
      // Continues on the spot after a passkey or a link (design 29d).
      onVerified: () => void
      failure: IdentityCheckFailure | null
    }

const toOpenDialog = (settingsContinue: SettingsContinue): OpenDialog =>
  settingsContinue.dialog === 'remove-passkey'
    ? { name: 'remove-passkey', passkeyId: settingsContinue.passkeyId }
    : { name: settingsContinue.dialog }

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1)

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    emergencyPassword,
    identityCheckFailure,
    otherSessionsCount,
    passkeys,
    recentAuthenticationRemainingMs,
    settingsContinue,
    showWelcome,
    signInAttempts,
    user,
  } = loaderData

  const navigate = useNavigate()
  const location = useLocation()
  const mutationFetcher = useFetcher()
  // Owned here, not by the section: the section unmounts once the sign-ins end.
  const signInsFetcher = useFetcher<typeof action>()
  // Keyed: the root layout reads the pending scheme and repaints on click.
  const colorSchemeFetcher = useFetcher({
    key: COLOR_SCHEME_CONFIG.fetcherKey,
  })
  // Closing the welcome row hides it at once (design 29e).
  const welcomeFetcher = useFetcher()
  const colorScheme = useColorScheme()
  const authenticityToken = useAuthenticityToken()
  const showToast = useToast()

  const [openDialog, setOpenDialog] = useState<OpenDialog | null>(null)
  const [passkeyProblem, setPasskeyProblem] =
    useState<RegistrationProblem | null>(null)

  // Anchor the server's remaining time to this browser's clock when the data
  // arrives, so a skewed clock cannot shift it.
  const recentAuthenticationExpiresAt = useMemo(
    () => Date.now() + recentAuthenticationRemainingMs,
    [recentAuthenticationRemainingMs],
  )

  const isRecentlyAuthenticated = useCallback(
    () => Date.now() < recentAuthenticationExpiresAt,
    [recentAuthenticationExpiresAt],
  )

  const passkeyRegistration = useRegisterPasskey(setPasskeyProblem)

  // Opens the identity check (design 29d). `settingsContinue` is the dialog
  // Google returns to, `null` the bare page; `onVerified` continues on the
  // spot after a passkey or a link.
  const requireIdentityCheck = (
    settingsContinue: SettingsContinue | null,
    onVerified: () => void,
    failure: IdentityCheckFailure | null = null,
  ) => {
    setOpenDialog({
      failure,
      name: 'identity-check',
      onVerified,
      settingsContinue,
    })
  }

  // Opens a dialog that changes a sign-in method, or the identity check first
  // when the last authentication is too old (design 29d).
  const openWithIdentityCheck = (
    dialog: OpenDialog,
    settingsContinue: SettingsContinue | null,
  ) => {
    if (isRecentlyAuthenticated()) {
      setOpenDialog(dialog)
      return
    }

    requireIdentityCheck(settingsContinue, () => setOpenDialog(dialog))
  }

  // Adding a passkey continues with a button: the browser creates a passkey
  // only after a new click (29d). The row's „znovu se ověřte“ goes with it.
  const requireIdentityCheckForPasskey = () => {
    setPasskeyProblem(null)
    requireIdentityCheck({ dialog: 'add-passkey' }, () =>
      setOpenDialog({ name: 'add-passkey' }),
    )
  }

  // The welcome row adds a passkey the way the Passkey row does (design 29e).
  const handleWelcomeAddPasskey = () => {
    if (!isRecentlyAuthenticated()) {
      requireIdentityCheckForPasskey()
      return
    }

    passkeyRegistration.start()
  }

  const dismissWelcome = () => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(
      FORM_CONFIG.intent.name,
      FORM_CONFIG.intent.value.dismissWelcome,
    )

    void welcomeFetcher.submit(formData, { method: 'POST' })
  }

  // Unmount a dialog once it closed, unless another one took its place.
  const closeDialog = (dialog: OpenDialog) => () =>
    setOpenDialog((current) => (current === dialog ? null : current))

  // Back from Google: reopen the dialog the person was on their way to, or
  // the identity check with what went wrong (also when the session went
  // stale meanwhile), and drop the one-shot hints from the address (design
  // 29d, 30a).
  useEffect(() => {
    if (settingsContinue === null && identityCheckFailure === null) return

    const continueTo =
      settingsContinue === null ? null : toOpenDialog(settingsContinue)

    if (identityCheckFailure === null && isRecentlyAuthenticated()) {
      setOpenDialog(continueTo)
    } else {
      setOpenDialog({
        failure: identityCheckFailure,
        name: 'identity-check',
        onVerified: () => setOpenDialog(continueTo),
        settingsContinue,
      })
    }

    void navigate(location.pathname, {
      preventScrollReset: true,
      replace: true,
    })
  }, [
    identityCheckFailure,
    isRecentlyAuthenticated,
    location.pathname,
    navigate,
    settingsContinue,
  ])

  const signInsResult = signInsFetcher.data

  useEffect(() => {
    if (signInsResult === undefined || !('status' in signInsResult)) return
    if (signInsResult.status !== 'other-sign-ins-ended') return

    showToast('Všechna ostatní přihlášení jsou ukončena.')
  }, [showToast, signInsResult])

  const submitMutation = (action: string, fields: Record<string, string>) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)

    for (const [name, value] of Object.entries(fields)) {
      formData.append(name, value)
    }

    void mutationFetcher.submit(formData, { action, method: 'POST' })
  }

  // A removal and switching 2FA off were confirmed before the identity check,
  // so after a passkey or a link they run straight away. Once the page has
  // been to Google (success or a failure retried here), the confirmation
  // reopens instead: an address must not take a method away.
  const handleRemovePasskey = (passkeyId: string) => {
    const removePasskey = () =>
      submitMutation(href('/administration/settings/passkeys'), { passkeyId })

    if (!isRecentlyAuthenticated()) {
      requireIdentityCheck({ dialog: 'remove-passkey', passkeyId }, () => {
        setOpenDialog(null)
        removePasskey()
      })
      return
    }

    removePasskey()
  }

  const handleDisableTwoFactor = () => {
    const disableTwoFactor = () =>
      submitMutation(href('/administration/settings/two-factor'), {
        [FORM_CONFIG.intent.name]: FORM_CONFIG.intent.value.delete,
      })

    if (!isRecentlyAuthenticated()) {
      requireIdentityCheck({ dialog: 'disable-two-factor' }, () => {
        setOpenDialog(null)
        disableTwoFactor()
      })
      return
    }

    disableTwoFactor()
  }

  const removedPasskey =
    openDialog?.name === 'remove-passkey'
      ? passkeys.find((passkey) => passkey.id === openDialog.passkeyId)
      : undefined
  // A named passkey needs no line under the dialog title (design 29d).
  const removedPasskeyLabel =
    removedPasskey === undefined || removedPasskey.name !== null
      ? null
      : getPasskeyLabel(removedPasskey)

  const authorRole = `${getAuthorRoleLabel(user.authorRoleName)} · ${
    authorRoleDescriptions[user.authorRoleName]
  }`

  return (
    <AdminPage>
      <AdminHeadline>Nastavení</AdminHeadline>

      {showWelcome && welcomeFetcher.state === 'idle' && (
        <WelcomeRow
          isAddingPasskey={passkeyRegistration.isPending}
          onAddPasskey={
            passkeyRegistration.isPasskeySupported
              ? handleWelcomeAddPasskey
              : undefined
          }
          onDismiss={dismissWelcome}
        />
      )}

      <AdminDetailLayout>
        <AdminDetailMain>
          <AdminDetailSection
            actions={
              <Button
                onClick={() => setOpenDialog({ name: 'profile' })}
                size={'sm'}
                type={'button'}
                variant={'outline'}
              >
                Upravit profil
              </Button>
            }
            title={'Profil'}
          >
            <div className={styles.profileHeader}>
              <AdminAvatar
                alt={user.image.altText}
                image={user.image.sources}
                name={user.authorName}
                size={'small'}
              />
              <div className={styles.profileName}>
                <span className={styles.name}>{user.authorName}</span>
                <span className={styles.email}>{user.email}</span>
              </div>
            </div>

            <AdminDetailList>
              <AdminDetailItem label={'Autorská role'}>
                {authorRole}
              </AdminDetailItem>
              <AdminDetailItem label={'Uživatelská role'}>
                {getUserRoleLabel(user.userRoleName)}
              </AdminDetailItem>
              <AdminDetailItem label={'Účet od'}>
                {user.createdAt}
              </AdminDetailItem>
            </AdminDetailList>

            <AdminParagraph className={styles.muted}>
              E-mail a role mění Administrátor nebo Vlastník.
            </AdminParagraph>
          </AdminDetailSection>

          <AdminDetailSection title={'Přihlášení'}>
            <div className={styles.rows}>
              <AdminDetailRow label={'Google'}>
                <span>{user.isGoogleLinked ? 'propojený' : 'nepropojený'}</span>
                {!user.isGoogleLinked && (
                  <span className={styles.note}>
                    Propojí se při prvním přihlášení přes Google s adresou
                    @vednemesicnik.cz.
                  </span>
                )}
              </AdminDetailRow>

              <AdminDetailRow label={'Odkaz v e-mailu'}>
                <span>k dispozici</span>
                <span className={styles.note}>
                  Na {user.email}. Nic se nenastavuje.
                </span>
              </AdminDetailRow>

              <AdminDetailRow
                actions={
                  <RegisterPasskey
                    isRecentlyAuthenticated={isRecentlyAuthenticated}
                    onRequireIdentityCheck={requireIdentityCheckForPasskey}
                    registration={passkeyRegistration}
                  />
                }
                align={'start'}
                label={'Passkey'}
              >
                {passkeys.length === 0 ? (
                  <span>Zatím žádný.</span>
                ) : (
                  <ul className={styles.passkeys}>
                    {passkeys.map((passkey) => {
                      const label = getPasskeyLabel(passkey)

                      return (
                        <li className={styles.passkey} key={passkey.id}>
                          <span className={styles.passkeyText}>
                            <span className={styles.passkeyTitle}>
                              {label.title}
                            </span>
                            <span className={styles.note}>
                              {getPasskeyDetails({
                                createdAt: passkey.createdAt,
                                lastUsedAt: passkey.lastUsedAt,
                                type: label.type,
                              }).map((detail, index) => (
                                <Fragment key={detail}>
                                  {/* The line breaks after a dot, never inside a date. */}
                                  {index > 0 && '\u00a0· '}
                                  <span className={styles.passkeyDetail}>
                                    {detail}
                                  </span>
                                </Fragment>
                              ))}
                            </span>
                          </span>
                          <TextButton
                            onClick={() =>
                              setOpenDialog({
                                name: 'remove-passkey',
                                passkeyId: passkey.id,
                              })
                            }
                          >
                            Odebrat…
                          </TextButton>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {passkeyProblem !== null && (
                  <PasskeyProblem
                    onRequireIdentityCheck={requireIdentityCheckForPasskey}
                    problem={passkeyProblem}
                  />
                )}
                <span className={clsx(styles.note, styles.passkeyDescription)}>
                  Přihlášení bez hesla pomocí passkey v zařízení nebo na
                  bezpečnostním klíči.
                </span>
                {/* Always shown: the app can't tell a shared computer (29a, f3mu0o7u). */}
                <span className={styles.note}>
                  Na sdíleném počítači ukládejte passkey do svého telefonu nebo
                  na svůj bezpečnostní klíč. Možnost vyberte v okně prohlížeče.
                </span>
              </AdminDetailRow>
            </div>
          </AdminDetailSection>

          {emergencyPassword !== null && (
            <AdminDetailSection title={'Nouzové přihlášení heslem'}>
              <AdminParagraph className={styles.muted}>
                Heslo slouží pro nouzové přihlášení, které je běžně vypnuté.
                Dvoufázové ověření platí jen při přihlášení heslem.
              </AdminParagraph>

              <div className={styles.rows}>
                <AdminDetailRow
                  actions={
                    <Button
                      onClick={() =>
                        openWithIdentityCheck(
                          { name: 'change-password' },
                          { dialog: 'change-password' },
                        )
                      }
                      size={'sm'}
                      type={'button'}
                      variant={'outline'}
                    >
                      {emergencyPassword.hasPassword ? 'Změnit…' : 'Nastavit…'}
                    </Button>
                  }
                  label={'Heslo'}
                >
                  {emergencyPassword.hasPassword ? 'nastavené' : 'nenastavené'}
                </AdminDetailRow>

                {emergencyPassword.isTwoFactorEnabled ? (
                  <AdminDetailRow
                    actions={
                      <>
                        <Button
                          // Not reopened after the identity check: opening it
                          // replaces the codes, which an address must not do
                          // without a click.
                          onClick={() =>
                            openWithIdentityCheck(
                              { name: 'new-backup-codes' },
                              null,
                            )
                          }
                          size={'sm'}
                          type={'button'}
                          variant={'outline'}
                        >
                          Nové záložní kódy
                        </Button>
                        <TextButton
                          onClick={() =>
                            setOpenDialog({ name: 'disable-two-factor' })
                          }
                        >
                          Vypnout…
                        </TextButton>
                      </>
                    }
                    label={'Dvoufázové ověření'}
                  >
                    <span>zapnuté</span>
                    <span className={styles.note}>
                      {formatRemainingBackupCodes(
                        emergencyPassword.unusedBackupCodesCount,
                      )}
                    </span>
                  </AdminDetailRow>
                ) : (
                  <AdminDetailRow
                    actions={
                      emergencyPassword.hasPassword ? (
                        <Button
                          onClick={() =>
                            openWithIdentityCheck(
                              { name: 'enable-two-factor' },
                              { dialog: 'enable-two-factor' },
                            )
                          }
                          size={'sm'}
                          type={'button'}
                          variant={'outline'}
                        >
                          Zapnout…
                        </Button>
                      ) : (
                        <span className={styles.note}>
                          Nejdřív nastavte heslo.
                        </span>
                      )
                    }
                    label={'Dvoufázové ověření'}
                  >
                    vypnuté
                  </AdminDetailRow>
                )}
              </div>

              {emergencyPassword.isTwoFactorEnabled &&
                emergencyPassword.unusedBackupCodesCount <= 2 && (
                  <p className={styles.warning}>
                    {capitalize(
                      formatRemainingBackupCodes(
                        emergencyPassword.unusedBackupCodesCount,
                      ),
                    )}
                    . Vytvořte nové.
                  </p>
                )}
            </AdminDetailSection>
          )}
        </AdminDetailMain>

        <AdminDetailAside>
          {/* „Vzhled a jazyk“ once #295 adds Jazyk (design 29a, 0d0khewy). */}
          <AdminDetailSection title={'Vzhled'}>
            <colorSchemeFetcher.Form method={'post'}>
              <AuthenticityTokenInput />
              <input
                name={FORM_CONFIG.intent.name}
                type={'hidden'}
                value={FORM_CONFIG.intent.value.updateColorScheme}
              />
              {/* Applies on click, no Save (29a); the hint only under Systém (0d0khewy). */}
              <SegmentedControl
                hint={
                  colorScheme === 'system'
                    ? 'Vzhled se řídí nastavením zařízení.'
                    : undefined
                }
                legend={'Režim'}
                name={COLOR_SCHEME_CONFIG.fieldName}
                onChange={(event) => {
                  // Read now: React restores the controlled radio before the
                  // transition's update runs.
                  const formData = new FormData(
                    event.currentTarget.form ?? undefined,
                  )
                  const nextColorScheme = event.currentTarget
                    .value as ColorScheme

                  // The whole page changes colour: cross-fade it once the
                  // pending scheme is rendered, not after the round trip (#560).
                  runWithViewTransition(async () => {
                    void colorSchemeFetcher.submit(formData, { method: 'post' })
                    await waitForColorScheme(nextColorScheme)
                  })
                }}
                options={colorSchemeOptions}
                value={colorScheme}
              />
            </colorSchemeFetcher.Form>
          </AdminDetailSection>
          {otherSessionsCount > 0 && (
            <AdminDetailSection title={'Přehled přihlášení'}>
              <AdminParagraph>
                {formatOtherSignIns(otherSessionsCount)}
              </AdminParagraph>

              {/* Nothing is lost and one can sign in again: a plain button, no dialog (design 29a). */}
              <signInsFetcher.Form method={'post'}>
                <AuthenticityTokenInput />
                <Button
                  name={FORM_CONFIG.intent.name}
                  size={'sm'}
                  type={'submit'}
                  value={FORM_CONFIG.intent.value.delete}
                  variant={'outline'}
                >
                  Ukončit všechna ostatní přihlášení
                </Button>
              </signInsFetcher.Form>
            </AdminDetailSection>
          )}
          {signInAttempts.length > 0 && (
            <AdminDetailSection title={'Poslední pokusy o přihlášení'}>
              <AdminSignInAttempts attempts={signInAttempts} />
              <AdminParagraph className={styles.note}>
                {otherSessionsCount > 0
                  ? 'Nepoznáváte některý pokus o přihlášení? Ukončete všechna ostatní přihlášení a obraťte se na Administrátora.'
                  : 'Nepoznáváte některý pokus o přihlášení? Obraťte se na Administrátora.'}
              </AdminParagraph>
            </AdminDetailSection>
          )}
        </AdminDetailAside>
      </AdminDetailLayout>

      {openDialog?.name === 'profile' && (
        <ProfileDialog
          bio={user.authorBio}
          hasImage={user.hasImage}
          image={user.image.sources}
          imageAlt={user.image.altText}
          name={user.authorName}
          onClose={closeDialog(openDialog)}
        />
      )}

      {openDialog?.name === 'identity-check' && (
        <IdentityCheckDialog
          email={user.email}
          failure={openDialog.failure}
          hasPasskey={passkeys.length > 0}
          isGoogleLinked={user.isGoogleLinked}
          isRecentlyAuthenticated={isRecentlyAuthenticated}
          onClose={closeDialog(openDialog)}
          onVerified={openDialog.onVerified}
          settingsContinuePath={buildSettingsContinuePath(
            openDialog.settingsContinue,
          )}
        />
      )}

      {openDialog?.name === 'add-passkey' && (
        <AddPasskeyDialog
          onAdd={passkeyRegistration.start}
          onClose={closeDialog(openDialog)}
        />
      )}

      {openDialog?.name === 'change-password' && emergencyPassword !== null && (
        <ChangePasswordDialog
          hasPassword={emergencyPassword.hasPassword}
          onClose={closeDialog(openDialog)}
          // A first password shows in the row as „nastavené“; a change would
          // not move the row, so it gets a toast (design 29d).
          onSaved={(isChange) => {
            if (isChange) showToast('Heslo bylo změněno.')
          }}
        />
      )}

      {(openDialog?.name === 'enable-two-factor' ||
        openDialog?.name === 'new-backup-codes') && (
        <TwoFactorDialog
          mode={
            openDialog.name === 'enable-two-factor' ? 'enable' : 'new-codes'
          }
          onClose={closeDialog(openDialog)}
        />
      )}

      {openDialog?.name === 'disable-two-factor' && (
        <ConfirmDialog
          confirmLabel={'Vypnout'}
          description={
            'Při přihlášení heslem už nebude potřeba kód z aplikace. Záložní kódy přestanou platit.'
          }
          onClose={closeDialog(openDialog)}
          onConfirm={handleDisableTwoFactor}
          title={'Vypnout dvoufázové ověření?'}
        />
      )}

      {openDialog?.name === 'remove-passkey' &&
        removedPasskey !== undefined && (
          <ConfirmDialog
            confirmLabel={'Odebrat'}
            description={`Tento passkey už nepůjde použít k přihlášení do tohoto účtu. ${
              removedPasskey.kind === 'security_key'
                ? 'Z bezpečnostního klíče'
                : 'Ze zařízení'
            } ho můžete smazat také.`}
            onClose={closeDialog(openDialog)}
            onConfirm={() => handleRemovePasskey(removedPasskey.id)}
            // A named passkey says which one in the title; a key, a phone and
            // a passkey without a name get the row's line under it (29d).
            subject={
              removedPasskeyLabel === null ? undefined : (
                <>
                  {removedPasskeyLabel.type === null ? (
                    // Without a name the type is the title, so it stands once.
                    removedPasskeyLabel.title
                  ) : (
                    <>
                      <span className={styles.subjectTitle}>
                        {removedPasskeyLabel.title}
                      </span>
                      {` · ${removedPasskeyLabel.type}`}
                    </>
                  )}
                  {` · přidán ${removedPasskey.createdAt}`}
                </>
              )
            }
            title={
              removedPasskey.name === null
                ? 'Odebrat passkey z účtu?'
                : `Odebrat passkey ${removedPasskey.name}?`
            }
          />
        )}
    </AdminPage>
  )
}
