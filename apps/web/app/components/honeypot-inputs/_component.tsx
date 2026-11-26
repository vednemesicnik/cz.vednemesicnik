import { useHoneypot } from '~/components/honeypot-provider'
import styles from './_styles.module.css'

export const HoneypotInputs = () => {
  const { nameFieldName, validFromFieldName, encryptedValidFrom } =
    useHoneypot()

  return (
    <div aria-hidden="true" className={styles.wrap}>
      <label htmlFor={nameFieldName}>Please leave this field blank</label>
      <input
        // biome-ignore lint/a11y/useValidAutocomplete: intentional non-standard value to defeat browser autofill on the honeypot field
        autoComplete="nope"
        defaultValue=""
        id={nameFieldName}
        name={nameFieldName}
        tabIndex={-1}
        type="text"
      />
      <input
        autoComplete="off"
        name={validFromFieldName}
        readOnly
        tabIndex={-1}
        type="text"
        value={encryptedValidFrom}
      />
    </div>
  )
}
