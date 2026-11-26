import { Form, href } from 'react-router'

import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button, type Variant } from '~/components/button'

type Props = {
  podcastId: string
  className?: string
  variant?: Variant
}

/**
 * *Nová epizoda* creates the draft and opens its editor (design 27d, log
 * 0020), so it posts. An outline beside a draft's state action (27i).
 */
export const NewEpisodeButton = ({
  podcastId,
  className,
  variant = 'primary',
}: Props) => (
  <Form
    action={href('/administration/podcasts/:podcastId/episodes/add-episode', {
      podcastId,
    })}
    className={className}
    method={'post'}
  >
    <AuthenticityTokenInput />
    <Button type={'submit'} variant={variant}>
      Nová epizoda
    </Button>
  </Form>
)
