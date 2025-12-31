import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Hyperlink } from '~/components/hyperlink'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent() {
  return (
    <Page>
      <HeadlineGroup>
        <Headline>Čtení, které vás chytne</Headline>
      </HeadlineGroup>
      <Paragraph>
        Všechny naše <span>články</span> si můžete prozatím přečíst na platformě{' '}
        <Hyperlink href={'https://medium.com/vednemesicnik'}>Medium</Hyperlink>.
      </Paragraph>
    </Page>
  )
}
