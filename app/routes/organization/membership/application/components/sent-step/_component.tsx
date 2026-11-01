import { href } from 'react-router'

import { CopyButton } from '~/components/copy-button'
import { LinkButton } from '~/components/link-button'

import styles from './_styles.module.css'

type Props = {
  code: string
  email: string
}

/** The sent page (design 15d): the code, and what happens next. */
export const SentStep = ({ code, email }: Props) => (
  <div className={styles.step}>
    <p className={styles.lead}>
      O přijetí rozhodne spolek. Odesláním přihlášky členství nevzniká. Pokud
      vás přijmeme, pošleme vám potvrzení na {email}.
    </p>

    <div className={styles.code}>
      <span className={styles.codeLabel}>Kód přihlášky</span>
      <span className={styles.codeValue}>
        <CopyButton value={code}>{code}</CopyButton>
      </span>
      <span className={styles.codeHint}>
        Při případném dotazu nám kód pomůže najít vaši přihlášku.
      </span>
    </div>

    <LinkButton
      className={styles.back}
      to={href('/organization')}
      variant={'outline'}
    >
      Zpět na stránku spolku
    </LinkButton>
  </div>
)
