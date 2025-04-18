// noinspection JSUnusedGlobalSymbols

import { Form, Link } from "react-router"

import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Headline } from "~/components/headline"
import { Image } from "~/components/image"
import { formConfig } from "~/config/form-config"
import { sizeConfig } from "~/config/size-config"
import { getUserImageSrc } from "~/utils/get-user-image-src"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const imageSrc = getUserImageSrc(loaderData.user.image?.id ?? "")
  const imageAlt = loaderData.user.image?.altText ?? ""

  return (
    <>
      <Headline>Profil</Headline>

      <Image
        src={imageSrc}
        alt={imageAlt}
        width={sizeConfig.userImage.width}
        height={sizeConfig.userImage.height}
      />
      <p>e-mail: {loaderData.user.email}</p>
      <p>uživatelské jméno: {loaderData.user.username}</p>
      <p>jméno: {loaderData.user.name}</p>

      <Link to={"/administration/settings/profile/change-password"}>
        Změnit heslo
      </Link>

      {loaderData.user.sessions.length > 0 && (
        <section>
          <p>
            Počet přihlášení na jiných zařízeních:{" "}
            {loaderData.user.sessions.length}
          </p>
          <Form method="post">
            <input type="hidden" name={"userId"} value={loaderData.user.id} />
            <input
              type="hidden"
              name={"currentSessionId"}
              value={loaderData.currentSession.id}
            />
            <AuthenticityTokenInput />
            <button
              type="submit"
              name={formConfig.intent.name}
              value={formConfig.intent.value.delete}
            >
              Ukončit přihlášení
            </button>
          </Form>
        </section>
      )}
    </>
  )
}

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"
