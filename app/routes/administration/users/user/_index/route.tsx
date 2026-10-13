// noinspection JSUnusedGlobalSymbols

import { useEffect, useRef, useState } from 'react'
import { href, useLocation, useNavigate, useSearchParams } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminSignInAttempts } from '~/components/admin/admin-sign-in-attempts'
import { Callout } from '~/components/callout'
import { HistoryList } from '~/components/history-list'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { useToast } from '~/components/toast-provider'
import { INVITATION_CONFIG } from '~/config/invitation-config'
import { getAuthorRoleLabel, getUserRoleLabel } from '~/utils/role-labels'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EmergencyLinkDialog } from './components/emergency-link-dialog'
import { SignInMethod } from './components/sign-in-method'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    canDelete,
    canIssueEmergencyLink,
    canUpdate,
    emergencyLink,
    history,
    signInAttempts,
    signInMethods,
    user,
  } = loaderData
  const { userId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const [isEmergencyLinkDialogOpen, setIsEmergencyLinkDialogOpen] =
    useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const showToast = useToast()

  // The one-shot result of „Vytvořit a pozvat“ (design 28e, p8x1s8gs), read
  // once and dropped from the address: a failure stays on screen until the
  // page is left, a reload no longer shows it.
  const [invitation] = useState(() => ({
    result: searchParams.get(INVITATION_CONFIG.resultParam),
    userId,
  }))
  const isInvitationFailed =
    invitation.userId === userId &&
    invitation.result === INVITATION_CONFIG.result.failed

  useEffect(() => {
    if (invitation.result === null) return

    if (invitation.result === INVITATION_CONFIG.result.sent) {
      showToast(`Pozvánka odešla na ${user.email}.`)
    }

    void navigate(location.pathname, {
      preventScrollReset: true,
      replace: true,
    })
  }, [invitation, location.pathname, navigate, showToast, user.email])

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/users/:userId', { userId }),
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <div className={styles.header}>
        <div className={styles.title}>
          <AdminHeadline>{user.author.name}</AdminHeadline>
          <span className={styles.subtitle}>
            {user.email} · {getUserRoleLabel(user.role.name)}
          </span>
        </div>

        {/* No primary action; „⋯“ holds Smazat…, never on your own account or the Owner's (28e, 28g), and during a Google outage Vydat nouzový odkaz… above it. */}
        <div className={styles.actions}>
          <ActionMenu
            items={[
              ...(canIssueEmergencyLink
                ? [
                    {
                      label: 'Vydat nouzový odkaz…',
                      onSelect: () => setIsEmergencyLinkDialogOpen(true),
                    },
                  ]
                : []),
              ...(canDelete
                ? [{ danger: true, label: 'Smazat…', onSelect: openDialog }]
                : []),
            ]}
            label={'Další akce s účtem'}
          />
          {canUpdate && (
            <LinkButton
              to={href('/administration/users/:userId/edit-user', {
                userId,
              })}
              variant={'outline'}
            >
              Upravit
            </LinkButton>
          )}
        </div>
      </div>

      {isInvitationFailed && (
        <Callout tone={'warning'}>
          Účet je založený. Dejte pozvanému člověku vědět, ať se přihlásí přes
          Google nebo si na stránce přihlášení pošle odkaz — pozvánku na{' '}
          {user.email} se nepodařilo odeslat.
        </Callout>
      )}

      {/* Left how the person signs in, right the account's data and history (28e). */}
      <AdminDetailLayout>
        <AdminDetailMain>
          <AdminDetailSection title={'Přihlášení'}>
            <AdminDetailList>
              <AdminDetailItem label={'Heslo'}>
                <SignInMethod description={signInMethods.password} />
              </AdminDetailItem>
              <AdminDetailItem label={'Dvoufázové ověření'}>
                <SignInMethod description={signInMethods.twoFactor} />
              </AdminDetailItem>
              <AdminDetailItem label={'Passkey'}>
                <SignInMethod description={signInMethods.passkey} />
              </AdminDetailItem>
              <AdminDetailItem label={'Google'}>
                <SignInMethod description={signInMethods.google} />
              </AdminDetailItem>
              {/* Only while the link works, as of this load (28e). */}
              {emergencyLink !== null && (
                <AdminDetailItem label={'Nouzový odkaz'}>
                  <SignInMethod
                    description={{
                      note:
                        emergencyLink.issuerName === null
                          ? `vydaný ve ${emergencyLink.issuedAt}`
                          : `vydaný ve ${emergencyLink.issuedAt} · ${emergencyLink.issuerName}`,
                      status: `platí do ${emergencyLink.expiresAt}`,
                    }}
                  />
                </AdminDetailItem>
              )}
            </AdminDetailList>
          </AdminDetailSection>

          {signInAttempts.length > 0 && (
            <AdminDetailSection title={'Poslední pokusy o přihlášení'}>
              <AdminSignInAttempts attempts={signInAttempts} />
            </AdminDetailSection>
          )}
        </AdminDetailMain>

        <AdminDetailAside>
          <AdminDetailSection title={'Údaje'}>
            <AdminDetailList>
              <AdminDetailItem label={'Uživatelská role'}>
                {getUserRoleLabel(user.role.name)}
              </AdminDetailItem>
              <AdminDetailItem label={'Autor'}>
                <Link
                  to={href('/administration/authors/:authorId', {
                    authorId: user.author.id,
                  })}
                >
                  {user.author.name}
                </Link>{' '}
                · {getAuthorRoleLabel(user.author.role.name)}
              </AdminDetailItem>
              <AdminDetailItem label={'Účet od'}>
                {user.createdAt}
              </AdminDetailItem>
            </AdminDetailList>
          </AdminDetailSection>

          {/* An account older than the audit log has no Historie (by062t6n). */}
          {history.length > 0 && (
            <AdminDetailSection title={'Historie'}>
              <HistoryList entries={history} />
            </AdminDetailSection>
          )}
        </AdminDetailAside>
      </AdminDetailLayout>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      {isEmergencyLinkDialogOpen && (
        <EmergencyLinkDialog
          accountName={user.author.name}
          onClose={() => setIsEmergencyLinkDialogOpen(false)}
          previousLinkTime={emergencyLink?.issuedAt ?? null}
          userId={userId}
        />
      )}
    </AdminPage>
  )
}
