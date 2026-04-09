import { useHoneypot } from '~/components/honeypot-provider'
import styles from './_styles.module.css'

export const HoneypotInputs = () => {
  const { nameFieldName, validFromFieldName, encryptedValidFrom } =
    useHoneypot()

  return (
    <div className={styles.wrap} aria-hidden="true">
      <label htmlFor={nameFieldName}>Please leave this field blank</label>
      <input
        id={nameFieldName}
        name={nameFieldName}
        type="text"
        defaultValue=""
        autoComplete="nope"
        tabIndex={-1}
      />
      <input
        name={validFromFieldName}
        type="text"
        value={encryptedValidFrom}
        readOnly
        autoComplete="off"
        tabIndex={-1}
      />
    </div>
  )
}
