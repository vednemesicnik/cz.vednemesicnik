import { startAuthentication } from '@simplewebauthn/browser'
import { useEffect, useRef, useState } from 'react'
import { href, useFetcher, useRevalidator } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { FORM_CONFIG } from '~/config/form-config'
import type { action as googleAction } from '~/routes/administration/settings/verify-identity/google/_action'
import type { action as magicLinkAction } from '~/routes/administration/settings/verify-identity/magic-link/_action'
import type { action as generateAuthenticationOptionsAction } from '~/routes/administration/settings/verify-identity/passkey/generate-authentication-options/_action'
import type { action as verifyAuthenticationResponseAction } from '~/routes/administration/settings/verify-identity/passkey/verify-authentication-response/_action'
import { formatRetryAfter } from '~/utils/format-retry-after'
import type { IdentityCheckFailure } from '~/utils/identity-check/parse-identity-check-failure'
import { useBiometric } from '~/utils/use-biometric'

import { useModalDialog } from '../../utils/use-modal-dialog'
import { TextButton } from '../text-button'
import styles from './_styles.module.css'

// Approved copy (copywriter thread njslpjov, drawn in 29d by so197jap).
const failureMessages: Record<IdentityCheckFailure, string> = {
  'google-account':
    'Vyberte propojený účet Google — zvoleným účtem se tady nelze ověřit.',
  'google-failed':
    'Zkuste to znovu nebo se ověřte jinak — ověření přes Google se nepodařilo.',
}

const PASSKEY_FAILED_MESSAGE =
  'Ověřte se jinak — tento passkey se nepodařilo ověřit.'
const LINK_FAILED_MESSAGE =
  'Zkuste to za chvíli nebo se ověřte jinak — odkaz se nepodařilo odeslat.'

const formatPathRateLimit = (retryAfter: number) =>
  `Ověřte se jinak nebo to zkuste ${formatRetryAfter(retryAfter)}.`

const formatLinkRateLimit = (retryAfter: number) =>
  `Odkaz si pošlete ${formatRetryAfter(retryAfter)}.`

type Props = {
  // The signed-in user's address, where the link goes.
  email: string
  hasPasskey: boolean
  isGoogleLinked: boolean
  // Where Google returns: Nastavení with the dialog to reopen (30a).
  settingsContinuePath: string
  // Whether this session may change sign-in methods; turns true once verified.
  isRecentlyAuthenticated: () => boolean
  // A failure the page came back with from Google.
  failure: IdentityCheckFailure | null
  // Continues with the change the check was for.
  onVerified: () => void
  onClose: () => void
}

/**
 * The identity check before a change of a sign-in method (design 29d): a
 * passkey on the spot, a round trip to Google, or a link by e-mail, each only
 * when the account has it. Nothing signs out; once this browser's session is
 * fresh again, `onVerified` continues with the change.
 */
export const IdentityCheckDialog = ({
  email,
  hasPasskey,
  isGoogleLinked,
  settingsContinuePath,
  isRecentlyAuthenticated,
  failure,
  onVerified,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)
  const { isBiometricSupported } = useBiometric()
  const revalidator = useRevalidator()
  const authenticityToken = useAuthenticityToken()

  const generateOptionsFetcher =
    useFetcher<typeof generateAuthenticationOptionsAction>()
  const verifyResponseFetcher =
    useFetcher<typeof verifyAuthenticationResponseAction>()
  const googleFetcher = useFetcher<typeof googleAction>()
  const linkFetcher = useFetcher<typeof magicLinkAction>()

  const [isLinkSent, setIsLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(
    failure === null ? null : failureMessages[failure],
  )

  // Continue once the session is fresh: the passkey check revalidates on its
  // own, the link when the person comes back to this tab.
  const onVerifiedRef = useRef(onVerified)
  onVerifiedRef.current = onVerified

  useEffect(() => {
    if (isRecentlyAuthenticated()) {
      onVerifiedRef.current()
    }
  }, [isRecentlyAuthenticated])

  useEffect(() => {
    if (!isLinkSent) return

    const handleReturn = () => {
      if (document.visibilityState === 'visible') {
        void revalidator.revalidate()
      }
    }

    window.addEventListener('focus', handleReturn)
    document.addEventListener('visibilitychange', handleReturn)

    return () => {
      window.removeEventListener('focus', handleReturn)
      document.removeEventListener('visibilitychange', handleReturn)
    }
  }, [isLinkSent, revalidator])

  // Passkey: once the challenge arrives, run the browser's prompt and send
  // the assertion. A closed or expired prompt says nothing (as in 20a).
  const options =
    generateOptionsFetcher.data?.status === 'success'
      ? generateOptionsFetcher.data.options
      : null
  const startedOptionsRef = useRef<typeof options>(null)
  const { submit: submitAssertion } = verifyResponseFetcher

  useEffect(() => {
    if (options === null || startedOptionsRef.current === options) return
    startedOptionsRef.current = options

    const authenticate = async () => {
      try {
        const response = await startAuthentication({ optionsJSON: options })

        void submitAssertion(JSON.stringify(response), {
          action: href(
            '/administration/settings/verify-identity/passkey/verify-authentication-response',
          ),
          encType: 'application/json',
          method: 'POST',
        })
      } catch {
        // Dismissed, or no passkey of this account on the device.
      }
    }

    void authenticate()
  }, [options, submitAssertion])

  const passkeyResult = verifyResponseFetcher.data
  useEffect(() => {
    if (passkeyResult?.status === 'failed') {
      setError(PASSKEY_FAILED_MESSAGE)
    } else if (passkeyResult?.status === 'rate-limited') {
      setError(formatPathRateLimit(passkeyResult.retryAfter))
    }
  }, [passkeyResult])

  const googleResult = googleFetcher.data
  useEffect(() => {
    if (googleResult?.status === 'failed') {
      setError(failureMessages['google-failed'])
    } else if (googleResult?.status === 'rate-limited') {
      setError(formatPathRateLimit(googleResult.retryAfter))
    }
  }, [googleResult])

  const linkResult = linkFetcher.data
  useEffect(() => {
    if (linkResult?.status === 'sent') {
      setIsLinkSent(true)
    } else if (linkResult?.status === 'failed') {
      setError(LINK_FAILED_MESSAGE)
    } else if (linkResult?.status === 'rate-limited') {
      setError(formatLinkRateLimit(linkResult.retryAfter))
    }
  }, [linkResult])

  // Switching steps unmounts the focused button: move focus to the new step,
  // so keyboard and screen-reader users land on what changed.
  const sentRef = useRef<HTMLParagraphElement>(null)
  const pathsRef = useRef<HTMLDivElement>(null)
  const isFirstStepRef = useRef(true)

  useEffect(() => {
    if (isFirstStepRef.current) {
      isFirstStepRef.current = false
      return
    }

    if (isLinkSent) {
      sentRef.current?.focus()
    } else {
      pathsRef.current?.querySelector('button')?.focus()
    }
  }, [isLinkSent])

  // Google counts as pending only while submitting: after the redirect it
  // stays `loading`, and a page restored by Back would keep every path disabled.
  const isPending =
    generateOptionsFetcher.state !== 'idle' ||
    verifyResponseFetcher.state !== 'idle' ||
    googleFetcher.state === 'submitting' ||
    linkFetcher.state !== 'idle'

  const withToken = (fields: Record<string, string> = {}) => {
    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)

    for (const [name, value] of Object.entries(fields)) {
      formData.append(name, value)
    }

    return formData
  }

  const handlePasskey = () => {
    setError(null)
    void generateOptionsFetcher.submit(null, {
      action: href(
        '/administration/settings/verify-identity/passkey/generate-authentication-options',
      ),
      method: 'POST',
    })
  }

  const handleGoogle = () => {
    setError(null)
    void googleFetcher.submit(withToken({ redirectTo: settingsContinuePath }), {
      action: href('/administration/settings/verify-identity/google'),
      method: 'POST',
    })
  }

  const handleLink = () => {
    setError(null)
    void linkFetcher.submit(withToken(), {
      action: href('/administration/settings/verify-identity/magic-link'),
      method: 'POST',
    })
  }

  const handleOtherWay = () => {
    setError(null)
    setIsLinkSent(false)
  }

  const handleCancel = () => ref.current?.close()

  const errorLine =
    error === null ? null : (
      <p className={styles.error} role={'alert'}>
        {error}
      </p>
    )

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Ověřte, že jste to vy</AdminModalTitle>

        {isLinkSent ? (
          <>
            <p className={styles.sent} ref={sentRef} tabIndex={-1}>
              Odkaz byl odeslán na <strong>{email}</strong>. Platí 15 minut.
            </p>
            <AdminModalDescription>
              Odkaz otevřete v tomto prohlížeči a potvrďte ověření. Pak se
              vraťte do této záložky — změna bude automaticky pokračovat.
            </AdminModalDescription>
            <AdminModalDescription>
              V jiném prohlížeči ověření tady nedokončíte. Pokud tam nejste
              přihlášeni, odkaz vás po potvrzení přihlásí jen tam.
            </AdminModalDescription>

            <div className={styles.waiting}>
              <div className={styles.links}>
                <TextButton disabled={isPending} onClick={handleLink}>
                  Poslat znovu
                </TextButton>
                <TextButton onClick={handleOtherWay}>Ověřit jinak</TextButton>
              </div>
              {/* A failed resend replaced nothing, so it takes the hint's place. */}
              {errorLine ?? (
                <p className={styles.hint}>Nový odkaz nahradí předchozí.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <AdminModalDescription>
              Před změnou způsobu přihlášení je potřeba ověření.
            </AdminModalDescription>

            <div className={styles.paths} ref={pathsRef}>
              {hasPasskey && isBiometricSupported && (
                <Button
                  disabled={isPending}
                  onClick={handlePasskey}
                  size={'sm'}
                  type={'button'}
                >
                  Ověřit pomocí passkey
                </Button>
              )}
              {isGoogleLinked && (
                <Button
                  disabled={isPending}
                  onClick={handleGoogle}
                  size={'sm'}
                  type={'button'}
                  variant={'outline'}
                >
                  Ověřit přes Google
                </Button>
              )}
              <div className={styles.link}>
                <p className={styles.account}>
                  Účet: <span className={styles.email}>{email}</span>
                </p>
                <Button
                  disabled={isPending}
                  onClick={handleLink}
                  size={'sm'}
                  type={'button'}
                  variant={'outline'}
                >
                  Poslat odkaz e-mailem
                </Button>
              </div>
            </div>

            {errorLine}
          </>
        )}

        <AdminModalActions>
          <Button
            onClick={handleCancel}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
