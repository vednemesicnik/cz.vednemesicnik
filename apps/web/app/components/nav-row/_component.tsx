import { clsx } from 'clsx'
import { type ReactNode, useEffect, useRef } from 'react'
import { ChevronLeftIcon } from '~/components/icons/chevron-left-icon'
import { ChevronRightIcon } from '~/components/icons/chevron-right-icon'
import { Tooltip } from '~/components/tooltip'
import styles from './_styles.module.css'
import { getRevealScrollLeft } from './utils/get-reveal-scroll-left'
import { useScrollEdges } from './utils/use-scroll-edges'

// Approved through the copywriter (xycwcjqe).
const PREVIOUS_LABEL = 'Posunout doleva'
const NEXT_LABEL = 'Posunout doprava'

// A step shows four fifths of a row more (d104jrnd).
const STEP_SHARE = 0.8

// The faded edge's width, kept clear beside the current item.
const REVEAL_PADDING = 40

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type StepButtonProps = {
  children: ReactNode
  isDisabled: boolean
  label: string
  onClick: () => void
}

const StepButton = ({
  children,
  isDisabled,
  label,
  onClick,
}: StepButtonProps) => (
  <Tooltip className={styles.stepTooltip} label={label}>
    <button
      aria-disabled={isDisabled ? true : undefined}
      aria-label={label}
      className={styles.step}
      onClick={onClick}
      type={'button'}
    >
      {children}
    </button>
  </Tooltip>
)

type Props = {
  accessibleLabel?: string
  children: ReactNode
  className?: string
  label: string
}

/**
 * A row of plain links under a page headline: the categories on `/articles`,
 * the years on `/archive` (design 11a, 14a). Not a filter: every item is its
 * own address. Compose it from `NavRowItem`s and an optional `NavRowMore`.
 *
 * One shape at every width (d104jrnd): the visible label, then 44 px pills in
 * one row. The row scrolls sideways only when the items don't fit; the edge
 * where more of them wait fades out, and with a mouse two step buttons sit at
 * the row's ends. The current item is kept in view.
 *
 * @param props.label - The visible label, and the navigation's accessible
 *   name unless `accessibleLabel` gives another ("Rubriky")
 * @param props.accessibleLabel - The accessible name when the visible label
 *   alone is too short out of context ("Roky v archivu" for "Roky", 14a)
 * @param props.children - The `NavRowItem`s in display order, then `NavRowMore`
 * @returns The navigation row
 */
export const NavRow = ({
  accessibleLabel,
  children,
  className,
  label,
}: Props) => {
  const listRef = useRef<HTMLUListElement>(null)
  const edges = useScrollEdges(listRef)
  const isOverflowing = edges.start || edges.end
  const revealedRef = useRef<{
    current: Element | null
    isOverflowing: boolean
  }>({ current: null, isOverflowing: false })

  // Brings the current item into view when it changes, and when the step
  // buttons appear and narrow the row. Instantly on load and on a change of
  // width, smoothly when the current item moves.
  useEffect(() => {
    const list = listRef.current

    if (list === null) return

    const current = list.querySelector('[aria-current]')
    const revealed = revealedRef.current

    if (
      current === revealed.current &&
      isOverflowing === revealed.isOverflowing
    ) {
      return
    }

    const hasMoved = revealed.current !== null && current !== revealed.current
    revealedRef.current = { current, isOverflowing }

    if (current === null) return

    const listBox = list.getBoundingClientRect()
    const itemBox = current.getBoundingClientRect()
    const offset = list.scrollLeft - listBox.left
    const left = getRevealScrollLeft({
      clientWidth: list.clientWidth,
      itemEnd: itemBox.right + offset,
      itemStart: itemBox.left + offset,
      padding: REVEAL_PADDING,
      scrollLeft: list.scrollLeft,
    })

    if (left === null) return

    list.scrollTo({
      behavior: hasMoved && !prefersReducedMotion() ? 'smooth' : 'auto',
      left,
    })
  })

  const step = (direction: -1 | 1) => {
    const list = listRef.current
    const canMove = direction < 0 ? edges.start : edges.end

    if (list === null || !canMove) return

    list.scrollBy({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      left: direction * list.clientWidth * STEP_SHARE,
    })
  }

  return (
    <nav
      aria-label={accessibleLabel ?? label}
      className={clsx(styles.row, className)}
    >
      <span aria-hidden={true} className={styles.label}>
        {label}
      </span>
      {isOverflowing && (
        <StepButton
          isDisabled={!edges.start}
          label={PREVIOUS_LABEL}
          onClick={() => step(-1)}
        >
          <ChevronLeftIcon />
        </StepButton>
      )}
      <ul
        className={styles.list}
        data-end={edges.end ? '' : undefined}
        data-start={edges.start ? '' : undefined}
        ref={listRef}
      >
        {children}
      </ul>
      {isOverflowing && (
        <StepButton
          isDisabled={!edges.end}
          label={NEXT_LABEL}
          onClick={() => step(1)}
        >
          <ChevronRightIcon />
        </StepButton>
      )}
    </nav>
  )
}
