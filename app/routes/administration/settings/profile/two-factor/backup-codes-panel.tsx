import { AdminButton } from '~/components/admin/admin-button'
import { useHydrated } from '~/utils/use-hydrated'

import styles from './backup-codes-panel.module.css'

type Props = {
  codes: string[]
}

// Assemble the downloadable .txt contents from the one-time codes.
const buildFileContents = (codes: string[]) =>
  [
    'Vedneměsíčník — záložní kódy pro dvoufázové ověření',
    '',
    'Uložte tyto kódy na bezpečném místě. Každý kód lze použít pouze jednou.',
    '',
    ...codes,
    '',
  ].join('\n')

export const BackupCodesPanel = ({ codes }: Props) => {
  const isHydrated = useHydrated()

  // Client-side Blob download: the plaintext codes exist only in this response,
  // so there is nothing to re-serve from the server.
  const handleDownload = () => {
    const blob = new Blob([buildFileContents(codes)], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.download = 'zalozni-kody-vednemesicnik.txt'
    anchor.href = url
    anchor.click()

    URL.revokeObjectURL(url)
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Záložní kódy</h2>

      <p className={styles.warning}>
        Uložte si tyto kódy na bezpečné místo — zobrazí se pouze teď. Každý kód
        lze při přihlášení použít místo kódu z aplikace, a to jen jednou.
      </p>

      <ul className={styles.codes}>
        {codes.map((code) => (
          <li className={styles.code} key={code}>
            {code}
          </li>
        ))}
      </ul>

      {isHydrated && (
        <AdminButton onClick={handleDownload} type="button" variant="secondary">
          Stáhnout .txt
        </AdminButton>
      )}
    </section>
  )
}
