// noinspection JSUnusedGlobalSymbols

import type { AuthorRoleName } from '@generated/prisma/enums'
import { useCallback, useEffect, useState } from 'react'
import { Form, href, useFetcher, useLocation, useNavigate } from 'react-router'

import { AdminAvatar } from '~/components/admin/admin-avatar'
import { AdminButton } from '~/components/admin/admin-button'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { getAuthorRoleLabel, getUserRoleLabel } from '~/utils/role-labels'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ChangePasswordDialog } from './components/change-password-dialog'
import { ConfirmDialog } from './components/confirm-dialog'
import { IdentityCheckDialog } from './components/identity-check-dialog'
import { ProfileDialog } from './components/profile-dialog'
import { RegisterPasskey } from './components/register-passkey'
import { SettingsRow } from './components/settings-row'
import { TextButton } from './components/text-button'
import { TwoFactorDialog } from './components/two-factor-dialog'
import { buildSettingsContinuePath } from './utils/build-settings-continue-path'
import { formatRemainingBackupCodes } from './utils/format-remaining-backup-codes'
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

// credentialDeviceType → row title (design 29a, today's state without a name).
const passkeyTypeLabels: Record<string, string> = {
  multiDevice: 'Synchronizovaný',
  singleDevice: 'Vázaný na zařízení',
}

type OpenDialog =
  | { name: 'profile' }
  | { name: 'change-password' }
  | { name: 'enable-two-factor' }
  | { name: 'new-backup-codes' }
  | { name: 'disable-two-factor' }
  | { name: 'remove-passkey'; passkeyId: string }
  | { name: 'identity-check'; settingsContinue: SettingsContinue | null }

const toOpenDialog = (settingsContinue: SettingsContinue): OpenDialog =>
  settingsContinue.dialog === 'remove-passkey'
    ? { name: 'remove-passkey', passkeyId: settingsContinue.passkeyId }
    : { name: settingsContinue.dialog }

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1)

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    emergencyPassword,
    otherSessionsCount,
    passkeys,
    recentAuthenticationExpiresAt,
    settingsContinue,
    user,
  } = loaderData

  const navigate = useNavigate()
  const location = useLocation()
  const mutationFetcher = useFetcher()
  const authenticityToken = useAuthenticityToken()

  const [openDialog, setOpenDialog] = useState<OpenDialog | null>(null)
  // „Heslo je změněné.“ stays under the status until the page is left (design
  // 29a): after a change the row itself would not move.
  const [isPasswordChanged, setIsPasswordChanged] = useState(false)

  const isRecentlyAuthenticated = useCallback(
    () => Date.now() < recentAuthenticationExpiresAt,
    [recentAuthenticationExpiresAt],
  )

  // Opens a dialog that changes a sign-in method, or the identity check first
  // when the sign-in is too old (design 29d). `settingsContinue` is the dialog
  // to reopen after signing in again; `null` returns to the bare page.
  const openWithIdentityCheck = (
    dialog: OpenDialog,
    settingsContinue: SettingsContinue | null,
  ) => {
    setOpenDialog(
      isRecentlyAuthenticated()
        ? dialog
        : { name: 'identity-check', settingsContinue },
    )
  }

  // Unmount a dialog once it closed, unless another one took its place.
  const closeDialog = (dialog: OpenDialog) => () =>
    setOpenDialog((current) => (current === dialog ? null : current))

  // Back from the identity check: reopen the dialog the person was on their
  // way to, and drop the one-shot hint from the address (design 30a).
  useEffect(() => {
    if (settingsContinue === null) return

    setOpenDialog(toOpenDialog(settingsContinue))
    void navigate(location.pathname, {
      preventScrollReset: true,
      replace: true,
    })
  }, [location.pathname, navigate, settingsContinue])

  const submitMutation = (action: string, fields: Record<string, string>) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)

    for (const [name, value] of Object.entries(fields)) {
      formData.append(name, value)
    }

    void mutationFetcher.submit(formData, { action, method: 'POST' })
  }

  const handleRemovePasskey = (passkeyId: string) => {
    if (!isRecentlyAuthenticated()) {
      setOpenDialog({
        name: 'identity-check',
        settingsContinue: { dialog: 'remove-passkey', passkeyId },
      })
      return
    }

    submitMutation(href('/administration/settings/passkeys'), { passkeyId })
  }

  const handleDisableTwoFactor = () => {
    if (!isRecentlyAuthenticated()) {
      setOpenDialog({
        name: 'identity-check',
        settingsContinue: { dialog: 'disable-two-factor' },
      })
      return
    }

    submitMutation(href('/administration/settings/two-factor'), {
      [FORM_CONFIG.intent.name]: FORM_CONFIG.intent.value.delete,
    })
  }

  const removedPasskey =
    openDialog?.name === 'remove-passkey'
      ? passkeys.find((passkey) => passkey.id === openDialog.passkeyId)
      : undefined

  const authorRole = `${getAuthorRoleLabel(user.authorRoleName)} · ${
    authorRoleDescriptions[user.authorRoleName]
  }`

  return (
    <AdminPage>
      <AdminHeadline>Nastavení</AdminHeadline>

      <div className={styles.columns}>
        <div className={styles.column}>
          <AdminDetailSection title={'Profil'}>
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
              <AdminButton
                className={styles.profileButton}
                onClick={() => setOpenDialog({ name: 'profile' })}
                type={'button'}
                variant={'secondary'}
              >
                Upravit profil
              </AdminButton>
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
              <SettingsRow
                note={
                  user.isGoogleLinked
                    ? undefined
                    : 'Propojí se při prvním přihlášení přes Google s adresou @vednemesicnik.cz.'
                }
                status={user.isGoogleLinked ? 'propojený' : 'nepropojený'}
                title={'Google'}
              />
              <SettingsRow
                note={`Na ${user.email}. Nic se nenastavuje.`}
                status={'k dispozici'}
                title={'Odkaz v e-mailu'}
              />
            </div>

            <div className={styles.passkeys}>
              <h3 className={styles.subheading}>Passkey</h3>
              {passkeys.length === 0 ? (
                <p className={styles.muted}>Zatím žádný.</p>
              ) : (
                <div className={styles.rows}>
                  {passkeys.map((passkey) => (
                    <SettingsRow
                      actions={
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
                      }
                      key={passkey.id}
                      status={`přidán ${passkey.createdAt}`}
                      title={
                        passkeyTypeLabels[passkey.deviceType] ??
                        passkey.deviceType
                      }
                    />
                  ))}
                </div>
              )}
              <p className={styles.muted}>
                Přihlášení otiskem prstu, obličejem nebo PINem zařízení, bez
                hesla.
              </p>
              <RegisterPasskey
                isRecentlyAuthenticated={isRecentlyAuthenticated}
                onRequireIdentityCheck={() =>
                  setOpenDialog({
                    name: 'identity-check',
                    settingsContinue: null,
                  })
                }
              />
            </div>
          </AdminDetailSection>

          {emergencyPassword !== null && (
            <AdminDetailSection title={'Nouzové přihlášení heslem'}>
              <AdminParagraph className={styles.muted}>
                Heslo slouží pro nouzové přihlášení, které je běžně vypnuté.
                Dvoufázové ověření platí jen při přihlášení heslem.
              </AdminParagraph>

              <div className={styles.rows}>
                <SettingsRow
                  actions={
                    <AdminButton
                      onClick={() =>
                        openWithIdentityCheck(
                          { name: 'change-password' },
                          { dialog: 'change-password' },
                        )
                      }
                      type={'button'}
                      variant={'secondary'}
                    >
                      {emergencyPassword.hasPassword ? 'Změnit…' : 'Nastavit…'}
                    </AdminButton>
                  }
                  note={isPasswordChanged ? 'Heslo je změněné.' : undefined}
                  status={
                    emergencyPassword.hasPassword ? 'nastavené' : 'nenastavené'
                  }
                  title={'Heslo'}
                />

                {emergencyPassword.isTwoFactorEnabled ? (
                  <SettingsRow
                    actions={
                      <>
                        <AdminButton
                          onClick={() =>
                            openWithIdentityCheck(
                              { name: 'new-backup-codes' },
                              null,
                            )
                          }
                          type={'button'}
                          variant={'secondary'}
                        >
                          Nové záložní kódy
                        </AdminButton>
                        <TextButton
                          onClick={() =>
                            setOpenDialog({ name: 'disable-two-factor' })
                          }
                        >
                          Vypnout…
                        </TextButton>
                      </>
                    }
                    footer={
                      emergencyPassword.unusedBackupCodesCount <= 2 ? (
                        <span className={styles.warning}>
                          {capitalize(
                            formatRemainingBackupCodes(
                              emergencyPassword.unusedBackupCodesCount,
                            ),
                          )}
                          . Vytvořte nové.
                        </span>
                      ) : undefined
                    }
                    note={formatRemainingBackupCodes(
                      emergencyPassword.unusedBackupCodesCount,
                    )}
                    status={'zapnuté'}
                    title={'Dvoufázové ověření'}
                  />
                ) : (
                  <SettingsRow
                    actions={
                      emergencyPassword.hasPassword ? (
                        <AdminButton
                          onClick={() =>
                            openWithIdentityCheck(
                              { name: 'enable-two-factor' },
                              { dialog: 'enable-two-factor' },
                            )
                          }
                          type={'button'}
                          variant={'secondary'}
                        >
                          Zapnout…
                        </AdminButton>
                      ) : (
                        <span className={styles.muted}>
                          Nejdřív nastavte heslo.
                        </span>
                      )
                    }
                    status={'vypnuté'}
                    title={'Dvoufázové ověření'}
                  />
                )}
              </div>
            </AdminDetailSection>
          )}
        </div>

        <div className={styles.column}>
          {otherSessionsCount > 0 && (
            <AdminDetailSection title={'Aktivní relace'}>
              <AdminDetailList>
                <AdminDetailItem
                  label={'Počet přihlášení na jiných zařízeních'}
                >
                  {otherSessionsCount}
                </AdminDetailItem>
              </AdminDetailList>

              <Form method={'post'}>
                <AuthenticityTokenInput />
                <AdminButton
                  name={FORM_CONFIG.intent.name}
                  type={'submit'}
                  value={FORM_CONFIG.intent.value.delete}
                  variant={'danger'}
                >
                  Ukončit všechna ostatní přihlášení
                </AdminButton>
              </Form>
            </AdminDetailSection>
          )}
        </div>
      </div>

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
          onClose={closeDialog(openDialog)}
          redirectTo={buildSettingsContinuePath(openDialog.settingsContinue)}
        />
      )}

      {openDialog?.name === 'change-password' && emergencyPassword !== null && (
        <ChangePasswordDialog
          hasPassword={emergencyPassword.hasPassword}
          onClose={closeDialog(openDialog)}
          onSaved={() => setIsPasswordChanged(emergencyPassword.hasPassword)}
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
            description={
              'Tento passkey už nebude možné použít k přihlášení. Jeho uloženou kopii můžete smazat i ze zařízení.'
            }
            onClose={closeDialog(openDialog)}
            onConfirm={() => handleRemovePasskey(removedPasskey.id)}
            subject={`${
              passkeyTypeLabels[removedPasskey.deviceType] ??
              removedPasskey.deviceType
            } · přidán ${removedPasskey.createdAt}`}
            title={'Odebrat passkey?'}
          />
        )}
    </AdminPage>
  )
}
