import type { RegistrationProblem } from '../register-passkey/get-registration-problem'
import { TextButton } from '../text-button'
import styles from './_styles.module.css'

const PROBLEM_MESSAGES: Record<RegistrationProblem, string> = {
  'already-registered':
    'Použijte stávající passkey — toto zařízení už má passkey k tomuto účtu.',
  failed: 'Zkuste passkey přidat znovu — přidání se nepovedlo.',
  reauthenticate: 'Před přidáním passkey se znovu ověřte.',
}

type Props = {
  problem: RegistrationProblem
  // Opens the identity check (design 29d).
  onRequireIdentityCheck: () => void
}

/**
 * Why adding a passkey failed, in the Passkey row's value column under the
 * list (design 29d, „Řádek Passkey v 29a“).
 */
export const PasskeyProblem = ({ problem, onRequireIdentityCheck }: Props) => (
  <p className={styles.problem} role={'alert'}>
    {PROBLEM_MESSAGES[problem]}
    {problem === 'reauthenticate' && (
      <>
        {' '}
        <TextButton onClick={onRequireIdentityCheck}>Ověřit</TextButton>
      </>
    )}
  </p>
)
