// noinspection JSUnusedGlobalSymbols

import { Headline } from "~/components/headline"
import { Page } from "~/components/page"

import { PasswordForm } from "./components/password-form"

export default function Route() {
  return (
    <Page>
      <Headline>Administrace - přihlášení</Headline>

      <PasswordForm />
    </Page>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
