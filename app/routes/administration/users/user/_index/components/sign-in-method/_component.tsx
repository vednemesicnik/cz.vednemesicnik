import type { SignInMethodDescription } from '~/utils/sign-in-methods/describe-sign-in-methods'

import styles from './_styles.module.css'

type Props = {
  description: SignInMethodDescription
}

/**
 * A sign-in method's value in the user detail (design 28e): its state, and
 * under it the note in small type when there is one.
 *
 * @param props.description - The method from `describeSignInMethods`.
 */
export const SignInMethod = ({ description }: Props) => (
  <span className={styles.method}>
    <span>{description.status}</span>
    {description.note !== null && (
      <span className={styles.note}>{description.note}</span>
    )}
  </span>
)
