// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Headline } from "~/components/headline"

export default function Route() {
  return (
    <>
      <Headline>Nastavení</Headline>

      <Link to={"/administration/settings/profile"}>Profil</Link>
    </>
  )
}

export { meta } from "./_meta"
