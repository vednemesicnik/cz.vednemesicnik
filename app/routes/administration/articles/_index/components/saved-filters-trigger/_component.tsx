import { clsx } from 'clsx'

import { Button } from '~/components/button'

import styles from './_styles.module.css'

type Props = {
  menuId: string
  matchingFilterName: string | undefined
  className?: string
}

/**
 * The Uložené filtry button (design 22d): its name, or with the saved filter
 * the current filters match exactly, „Uložené filtry: Rozpracované“. The list
 * places it twice, at the end of the row and in the scrolling row on a phone
 * (22g); both open the one menu.
 *
 * @param props.menuId - The id of the menu's popover.
 */
export const SavedFiltersTrigger = ({
  menuId,
  matchingFilterName,
  className,
}: Props) => (
  <Button
    className={clsx(styles.trigger, className)}
    popoverTarget={menuId}
    size={'sm'}
    type={'button'}
    variant={'outline'}
  >
    <span className={styles.text}>
      {matchingFilterName === undefined
        ? 'Uložené filtry'
        : `Uložené filtry: ${matchingFilterName}`}
    </span>
  </Button>
)
