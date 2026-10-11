import { useId, useState } from 'react'

import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { Label } from '~/components/label'
import { downloadTextFile } from '~/utils/download-text-file'

import styles from './_styles.module.css'

type Props = {
  codes: string[]
  // After „Nové záložní kódy“ the step says the previous codes no longer work.
  isReplacement: boolean
  isConfirmed: boolean
  onConfirmedChange: (isConfirmed: boolean) => void
  onDone: () => void
}

// Assemble the downloadable .txt contents from the one-time codes.
const buildFileContents = (codes: string[]) =>
  [
    'Vedneměsíčník — záložní kódy pro dvoufázové ověření',
    '',
    'Při nouzovém přihlášení heslem nahradí tyto kódy kód z ověřovací aplikace. Každý lze použít jednou. Uložte je na bezpečném místě.',
    '',
    ...codes,
    '',
  ].join('\n')

/**
 * The second step of the two-factor dialog (design 29c): the backup codes,
 * shown once, with a download and a copy, and „Hotovo“ only once the person
 * has ticked that they saved them.
 */
export const BackupCodesStep = ({
  codes,
  isReplacement,
  isConfirmed,
  onConfirmedChange,
  onDone,
}: Props) => {
  const checkboxId = useId()
  const [isCopied, setIsCopied] = useState(false)

  // Plaintext codes exist only in this response, so the download is built
  // client-side from what is already on the page (see downloadTextFile).
  const handleDownload = () =>
    downloadTextFile('zalozni-kody-vednemesicnik.txt', buildFileContents(codes))

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setIsCopied(true)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <>
      <AdminModalTitle>
        {isReplacement ? 'Nové záložní kódy' : 'Dvoufázové ověření je zapnuté'}
      </AdminModalTitle>

      {isReplacement && (
        <AdminModalDescription>
          Uložené záložní kódy nahraďte těmito — předchozí už neplatí.
        </AdminModalDescription>
      )}
      <AdminModalDescription>
        Při nouzovém přihlášení heslem nahradí tyto kódy kód z aplikace. Každý
        lze použít jednou. Uložte si je, znovu se nezobrazí.
      </AdminModalDescription>

      {/* biome-ignore lint/a11y/noRedundantRoles: WebKit drops list semantics when list-style is none; the explicit role restores them for VoiceOver. */}
      <ul className={styles.codes} role="list">
        {codes.map((code) => (
          <li className={styles.code} key={code}>
            {code}
          </li>
        ))}
      </ul>

      <div className={styles.tools}>
        <Button
          onClick={handleDownload}
          size={'sm'}
          type="button"
          variant="outline"
        >
          Stáhnout .txt
        </Button>
        <Button
          onClick={handleCopy}
          size={'sm'}
          type="button"
          variant="outline"
        >
          Zkopírovat
        </Button>
        <span aria-live={'polite'} className={styles.copied}>
          {isCopied ? 'Zkopírováno' : ''}
        </span>
      </div>

      <div className={styles.confirmation}>
        <input
          checked={isConfirmed}
          id={checkboxId}
          onChange={(event) => onConfirmedChange(event.target.checked)}
          type={'checkbox'}
        />
        <Label htmlFor={checkboxId}>Kódy mám uložené</Label>
      </div>

      <AdminModalActions>
        <Button
          disabled={!isConfirmed}
          onClick={onDone}
          size={'sm'}
          type={'button'}
        >
          Hotovo
        </Button>
      </AdminModalActions>
    </>
  )
}
