import { AdminButton } from '~/components/admin/admin-button'
import { downloadTextFile } from '~/utils/download-text-file'
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

  // Plaintext codes exist only in this response, so the download is built
  // client-side from what is already on the page (see downloadTextFile).
  const handleDownload = () =>
    downloadTextFile('zalozni-kody-vednemesicnik.txt', buildFileContents(codes))

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
