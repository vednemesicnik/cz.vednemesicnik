import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import { href } from 'react-router'

import styles from './_styles.module.css'

// 210 mm at the 96 px per inch a browser lays out in.
const A4_WIDTH_PX = (210 * 96) / 25.4

type Props = {
  /** Handed to whatever prints the sheet. */
  frameRef: RefObject<HTMLIFrameElement | null>
}

/**
 * The declaration as its own document on a desk (design 15d). The frame holds
 * the sheet 1 : 1 and only a transform shrinks it, so it keeps its A4 layout;
 * the desk and the shadow are outside the frame, so they never print. Without
 * `allow-scripts` the printed document can carry no behaviour.
 */
export const DeclarationFrame = ({ frameRef }: Props) => {
  const paperRef = useRef<HTMLDivElement>(null)
  // Until it is known, the drawing's scale from the stylesheet.
  const [scale, setScale] = useState<number | null>(null)

  useEffect(() => {
    const paper = paperRef.current
    if (paper === null) return

    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / A4_WIDTH_PX)
    })
    observer.observe(paper)

    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.desk}>
      <div
        className={styles.paper}
        ref={paperRef}
        style={
          scale === null
            ? undefined
            : ({ '--declaration-scale': scale } as CSSProperties)
        }
      >
        <iframe
          className={styles.frame}
          ref={frameRef}
          sandbox={'allow-same-origin allow-modals'}
          scrolling={'no'}
          src={href('/organization/membership/application/declaration')}
          title={'Přihláška do spolku'}
        />
      </div>
    </div>
  )
}
