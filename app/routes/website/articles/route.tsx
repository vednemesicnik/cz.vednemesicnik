import { Headline } from "app/components/headline"
import { Hyperlink } from "~/components/hyperlink"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"

export { loader } from "./_loader"
export { meta } from "./_meta"

export default function RouteComponent() {
  return (
    <Page>
      <Headline>Čtení, které vás chytne</Headline>
      <Paragraph>
        Všechny naše <span>články</span> si můžete prozatím přečíst na platformě{" "}
        <Hyperlink href={"https://medium.com/vednemesicnik"}>Medium</Hyperlink>.
      </Paragraph>
    </Page>
  )
}
