import { Activity, useCallback, useEffect, useRef, useState } from "react"
import { Form, Link } from "react-router"

import { AccountBoxIcon } from "~/components/icons/account-box-icon"
import { ExitToAppIcon } from "~/components/icons/exit-to-app-icon"

import styles from "./_styles.module.css"
import { Dropdown } from "./components/dropdown"
import { Toggle } from "./components/toggle"

type Props = {
  userName?: string
  userEmail: string
}

export const UserMenu = ({ userName, userEmail }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = userName || userEmail

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <div className={styles.container} ref={menuRef}>
      <Toggle isOpen={isOpen} onClick={handleToggle}>
        {displayName}
      </Toggle>

      <Activity mode={isOpen ? "visible" : "hidden"}>
        <Dropdown>
          <Link
            to="/administration/settings/profile"
            className={styles.link}
            onClick={handleClose}
          >
            <AccountBoxIcon className={styles.icon} />
            Profil
          </Link>
          <Form
            className={styles.form}
            method={"post"}
            action={"/administration/sign-out"}
          >
            <button className={styles.button} type="submit">
              <ExitToAppIcon className={styles.icon} />
              Odhlásit se
            </button>
          </Form>
        </Dropdown>
      </Activity>
    </div>
  )
}
