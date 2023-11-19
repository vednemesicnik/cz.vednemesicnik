// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"
import { Page } from "~/components/page"

export default function EditorialBoard() {
  return (
    <Page>
      <h1>Tak to je naše redakce</h1>
      <p>Prosím, seznamte se. Je nás hodně.</p>
      <ul>
        <li>
          <strong>šéfredaktoři:</strong>
        </li>
        <li>
          <strong>redaktoři:</strong>
        </li>
        <li>
          <strong>grafika:</strong>
        </li>
        <li>
          <strong>poradci:</strong>
        </li>
      </ul>
      <p>
        <strong>kontakt:</strong> <a href="mailto:redakce@vednemesicnik.cz">redakce@vednemesicnik.cz</a>
      </p>
    </Page>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Redakce" }]
}
